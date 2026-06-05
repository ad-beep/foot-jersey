import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Node.js runtime required — sharp is a native C++ module
export const runtime = 'nodejs';

// Keep sharp's memory footprint low so many concurrent invocations (e.g. an ad
// traffic spike) don't OOM the function. Disable libvips' internal cache and
// cap the thread pool to 1 — this proxy is only the fallback path now (most
// images are served straight from their CDN by the image-loader).
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

  // Decode and validate URL. Only https is allowed — the allowlisted CDNs all
  // serve over TLS, so plaintext http (and file:// / ftp:// SSRF vectors) are
  // rejected outright, before the hostname check.
  let src: string;
  try {
    src = decodeURIComponent(rawUrl);
    const parsed = new URL(src);
    if (parsed.protocol !== 'https:') {
      return new NextResponse('Invalid URL scheme', { status: 400 });
    }
    const { hostname } = parsed;
    if (!ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h))) {
      return new NextResponse('Host not allowed', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Fail OPEN: on ANY problem (upstream error, too large, sharp failure,
  // timeout) we 302 to the original image so the browser still loads it from
  // the source CDN. The proxy can never break an image or return a 5xx now.
  const passthrough = () =>
    NextResponse.redirect(src, { status: 302, headers: { 'Cache-Control': 'public, max-age=3600' } });

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

    if (!upstream.ok) return passthrough();

    const contentType = upstream.headers.get('content-type') ?? '';

    // Too large to safely process — just let the browser load the original.
    const contentLength = parseInt(upstream.headers.get('content-length') ?? '0', 10);
    if (contentLength > MAX_UPSTREAM_BYTES) return passthrough();

    const rawBuffer = await upstream.arrayBuffer();
    if (rawBuffer.byteLength > MAX_UPSTREAM_BYTES) return passthrough();
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

    // Resize + convert to WebP using sharp.
    const webp = await sharp(buffer)
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
    console.error('[/api/img] Processing error — falling back to original:', err);
    return passthrough();
  }
}
