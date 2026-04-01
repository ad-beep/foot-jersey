/**
 * Custom Next.js image loader — bypasses Vercel's /_next/image entirely.
 *
 * Shopify CDN supports free image transformation via URL:
 *   image.jpg → image_640x.webp  (resize + convert to WebP in one request)
 * WebP is 30–50% smaller than JPEG at equivalent quality.
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

  // Shopify CDN — resize + convert to WebP (free, built into the CDN)
  // e.g. image.jpg?v=123  →  image_640x.webp?v=123
  if (src.includes('cdn.shopify.com')) {
    return src.replace(/\.(jpg|jpeg|png|webp)(\?|$)/i, `_${width}x.webp$2`);
  }

  // Firebase Storage — admin uploads; serve as-is (already WebP from admin form)
  if (src.includes('firebasestorage.googleapis.com')) return src;

  // Any other external URL — serve as-is
  return src;
}
