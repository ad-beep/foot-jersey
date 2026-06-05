/**
 * Custom Next.js image loader.
 *
 * Shopify CDN and Firebase Storage images are public and scale fine, so we
 * serve them DIRECTLY from their own CDNs. We deliberately do NOT route them
 * through /api/img: the sharp-based proxy fetched + re-encoded every image per
 * request, and under a traffic spike that serverless function overloaded and
 * returned 5xx — breaking product images site-wide. (Shopify "Files" uploads
 * also can't be resized via URL params, so the proxy was the only resizer; not
 * worth the outage risk.) Only hotlink-protected Yupoo images still need the
 * proxy, and it now fails open (redirects to the original) so it can't break.
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

  // Public CDNs — serve directly (reliable + infinitely scalable, no proxy load)
  if (src.includes('firebasestorage.googleapis.com')) return src;
  if (src.includes('cdn.shopify.com')) return src;

  // Yupoo CDN — hotlink-protected, so it still needs the server proxy (which now
  // redirects to the original on any failure instead of erroring).
  if (src.includes('photo.yupoo.com') || src.includes('yupoo.com')) {
    return `/api/img?url=${encodeURIComponent(src)}&w=${width}`;
  }

  // Fallback for any other URL — serve as-is (can't proxy unknown hosts)
  return src;
}
