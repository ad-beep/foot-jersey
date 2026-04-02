/**
 * Custom Next.js image loader.
 *
 * Why a custom loader?
 * Product images come from Yupoo (photo.yupoo.com), which uses hotlink
 * protection and blocks server-side requests from Vercel's edge servers.
 * Yupoo images MUST be loaded directly by the browser — they cannot be
 * proxied through /_next/image or any server-side optimizer.
 *
 * Strategy:
 * - Yupoo URLs → return as-is so the browser fetches them directly
 * - Local static files → return as-is (Vercel serves them from CDN)
 * - All other external URLs (Shopify CDN, Firebase, etc.) → route through
 *   /_next/image for AVIF/WebP conversion + CDN-edge caching
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Local static files — served from Vercel edge as-is
  if (src.startsWith('/')) return src;

  // Yupoo images — hotlink protection blocks server-side fetching.
  // Return the URL unchanged so the browser loads it directly.
  if (src.includes('yupoo.com')) return src;

  // All other external images (Shopify CDN, Firebase Storage, etc.)
  // Route through the built-in optimizer for AVIF/WebP + CDN caching.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
