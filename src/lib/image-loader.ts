/**
 * Custom Next.js image loader — bypasses Vercel's /_next/image entirely.
 * Zero transformation credits. Each URL type is handled at its source.
 */
export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}): string {
  // Local static files (/images/...) — already .webp, served from Vercel edge
  if (src.startsWith('/')) return src;

  // Firebase Storage — admin uploads are already .webp, serve as-is
  if (src.includes('firebasestorage.googleapis.com')) return src;

  // Shopify CDN — use built-in size suffix: image.jpg → image_400x.jpg
  if (src.includes('cdn.shopify.com')) {
    return src.replace(/\.(jpg|jpeg|png|webp)(\?|$)/i, `_${width}x.$1$2`);
  }

  // Any other URL — serve as-is
  return src;
}
