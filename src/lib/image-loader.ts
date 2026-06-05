/**
 * Custom Next.js image loader.
 *
 * Image delivery strategy (see project_images memory / the /api/img outage):
 *
 *  • Shopify images are ~400KB JPEGs on a "Files" upload path that Shopify
 *    CANNOT resize via URL params. To get resized WebP/AVIF without a per-request
 *    serverless proxy (which OOM'd under ad traffic → 5xx → broken images), we
 *    route them through CLOUDINARY FETCH when configured. Cloudinary fetches the
 *    Shopify image once, resizes + converts it (f_auto,q_auto), caches it on its
 *    global CDN, and scales effortlessly. If no Cloudinary cloud name is set, we
 *    fall back to serving the Shopify image DIRECTLY (reliable, just heavier).
 *
 *  • Firebase Storage images are already reasonably sized and public — served
 *    directly.
 *
 *  • Yupoo images are hotlink-protected, so they still use the /api/img proxy
 *    (which now fails open / redirects to the original on any error).
 *
 *  • Local static files are returned as-is.
 */

// Public — the loader runs in the browser, and a Cloudinary cloud name isn't a
// secret. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in Vercel to enable optimisation.
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Build a Cloudinary fetch URL: resized, auto-format (WebP/AVIF), auto-quality. */
function cloudinaryFetch(src: string, width: number): string {
  const w = Math.min(Math.max(Math.round(width), 16), 1600);
  // c_limit = never upscale beyond the source; f_auto/q_auto = best format & quality.
  const transform = `f_auto,q_auto,c_limit,w_${w}`;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/${transform}/${encodeURIComponent(src)}`;
}

export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
}): string {
  // Local static files — served from Vercel edge as-is
  if (src.startsWith('/')) return src;

  // Shopify CDN — optimise via Cloudinary fetch when configured, else serve direct.
  if (src.includes('cdn.shopify.com')) {
    return CLOUDINARY_CLOUD ? cloudinaryFetch(src, width) : src;
  }

  // Firebase Storage — public and already reasonably sized; serve directly.
  if (src.includes('firebasestorage.googleapis.com')) return src;

  // Yupoo CDN — hotlink-protected, so it needs the server proxy (which now
  // redirects to the original on any failure instead of erroring).
  if (src.includes('photo.yupoo.com') || src.includes('yupoo.com')) {
    return `/api/img?url=${encodeURIComponent(src)}&w=${width}`;
  }

  // Fallback for any other URL — serve as-is (can't proxy unknown hosts)
  return src;
}
