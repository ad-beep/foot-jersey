/**
 * Custom Next.js image loader.
 *
 * Vercel's /_next/image optimizer has a monthly source-image quota on the
 * Hobby plan. To avoid 402 Payment Required errors, all images are returned
 * directly — Shopify CDN and Firebase already serve optimised, cached assets.
 */
export default function imageLoader({
  src,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return src;
}
