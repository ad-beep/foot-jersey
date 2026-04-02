/**
 * Custom Next.js image loader.
 *
 * Bypasses Vercel's /_next/image optimizer (monthly quota on Hobby plan).
 * Instead, uses Shopify CDN's free native image resizing (&width=N).
 * All other images are returned as-is.
 */
export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Local static files — served from Vercel edge as-is
  if (src.startsWith('/')) return src;

  // Shopify CDN — supports free native resizing via &width= param
  if (src.includes('cdn.shopify.com')) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}width=${width}`;
  }

  // All other external images — return as-is
  return src;
}
