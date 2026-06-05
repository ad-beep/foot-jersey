import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Node.js runtime required — sharp is a native C++ module
export const runtime = 'nodejs';

// Cap sharp's memory footprint so a traffic burst can't OOM the lambda.
// concurrency(1): one libvips thread per invocation (less RAM per request).
// cache(false): don't retain decoded images between requests.
// This is the difference between "survives an ad spike" and the 5xx outage.
sharp.cache(false);
sharp.concurrency(1);

// Images served through this proxy are immutable per (url, width) pair.
// Vercel CDN caches based on s-maxage; stale-while-revalidate allows
// background refresh without blocking the user.
const CACHE_HEADER = 'public, s-maxage=2592000, stale-while-revalidate=86400';

// Only proxy images from these hosts — prevents open proxy / SSRF abuse.
// New hosts must be reviewed before being added here.
const ALLOWED_HOSTS = [
  'cdn.shopify.com',
  'firebasestorage.googleapis.com',
  'photo.yupoo.com',
];

// Max raw image size we'll download — prevents memory exhaustion on huge upstream files
const MAX_UPSTREAM_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const widthParam = parseInt(searchParams.get('w') || '640', 10);
  const width = Number.isFinite(widthParam)
    ? Math.min(Math.max(widthParam, 16), 1200)
    : 640;

  if (!rawUrl) {
    return new NextResponse('url required', { status: 400 });
  }

  // Decode and validate URL — reject anything that isn't http(s) to prevent
  // file:// / ftp:// SSRF vectors even before the hostname check.
  let src: string;
  try {
    src = decodeURIComponent(rawUrl);
    const parsed = new URL(src);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return new NextResponse('Invalid URL scheme', { status: 400 });
    }
    const { hostname } = parsed;
    if (!ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h))) {
      return new NextResponse('Host not allowed', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Fail open: a real image must NEVER produce a 5xx. If anything downstream
  // goes wrong (slow upstream, oversize payload, sharp error), redirect the
  // browser to the original image instead of breaking it or alerting Vercel.
  // Short cache so a transiently-failing image isn't retried on every paint
  // but still recovers within minutes.
  const failOpen = () =>
    new NextResponse(null, {
      status: 302,
      headers: { Location: src, 'Cache-Control': 'public, max-age=300' },
    });

  try {
    // Fetch the original image from the upstream CDN (server-side — no browser Referer).
    // AbortController ensures we don't hang forever on a slow upstream.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    const upstream = await fetch(src, {
      headers: { 'User-Agent': 'FootJersey-ImgProxy/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!upstream.ok) {
      return failOpen();
    }

    const contentType = upstream.headers.get('content-type') ?? '';

    // Guard against absurdly large upstream payloads that could OOM the lambda
    const contentLength = parseInt(upstream.headers.get('content-length') ?? '0', 10);
    if (contentLength > MAX_UPSTREAM_BYTES) {
      return failOpen();
    }

    const rawBuffer = await upstream.arrayBuffer();
    if (rawBuffer.byteLength > MAX_UPSTREAM_BYTES) {
      return failOpen();
    }
    const buffer = Buffer.from(rawBuffer);

    // For SVG: pass through as-is (sharp can't convert SVG reliably)
    if (contentType.includes('svg')) {
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': CACHE_HEADER,
        },
      });
    }

    // Resize + convert to WebP using sharp (quality 88 = visually lossless for product photos).
    // failOn: 'none' — tolerate slightly truncated/odd source files instead of throwing.
    const webp = await sharp(buffer, { failOn: 'none' })
      .resize(width, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 88 })
      .toBuffer();

    return new NextResponse(webp as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': CACHE_HEADER,
        'X-Img-Width': String(width),
      },
    });
  } catch (err) {
    console.error('[/api/img] Processing error (failing open to original):', err);
    return failOpen();
  }
}
