/**
 * Custom Next.js image loader.
 *
 * Routes Shopify CDN and Firebase images through /api/img — a server-side
 * proxy that fetches without a browser Referer header (bypasses hotlink
 * protection), resizes with sharp, converts to WebP, and caches on Vercel
 * CDN for 30 days. Uses regular bandwidth, not image-optimization credits.
 *
 * Local static files are returned as-is (already optimized).
 */
export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}): string {
  // Local static files — served from Vercel edge as-is
  if (src.startsWith('/')) return src;

  // External images — route through our /api/img proxy for WebP + resize
  if (
    src.includes('cdn.shopify.com') ||
    src.includes('firebasestorage.googleapis.com')
  ) {
    return `/api/img?url=${encodeURIComponent(src)}&w=${width}`;
  }

  // Fallback for any other URL — serve as-is
  return src;
}
