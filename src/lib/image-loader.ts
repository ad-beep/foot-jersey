/**
 * Custom Next.js image loader — routes external images through our own
 * /api/img proxy, which resizes and converts to WebP using sharp.
 *
 * Why a proxy instead of direct CDN URLs?
 * - Images are hosted on a third-party Shopify CDN we don't own.
 *   We cannot rely on that CDN's transformation capabilities.
 * - The proxy uses sharp to guarantee WebP + resizing regardless of source.
 * - Vercel CDN caches the resulting WebP (s-maxage=30d) so subsequent
 *   requests are served from the edge — just as fast as the original CDN.
 * - Uses regular Vercel bandwidth, not image optimization credits.
 */
export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}): string {
  // Local static files — served from Vercel edge as-is (already optimized)
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
