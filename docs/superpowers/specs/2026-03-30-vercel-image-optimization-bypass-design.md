# Vercel Image Optimization Bypass — Design

## Problem

The site has hit Vercel's 5,000/month Image Optimization limit. Every `<Image>` component routes requests through `/_next/image`, which counts as a transformation credit. This causes broken images once the limit is reached and will recur at any traffic level.

## Solution

Set `unoptimized: true` globally in `next.config.js`. This tells Next.js to serve all `<Image>` components as direct passthrough — the `src` URL is used as-is, with no routing through `/_next/image`. Zero transformation credits are consumed.

## Why This Is Safe

- **Product images** come from Firebase Storage (Google CDN). They are served directly to the browser. No quality loss — the stored file is the source of truth.
- **Category images** are local `.webp` files in `/public/images/categories/`. With `unoptimized`, they are served as static assets from Vercel's edge CDN under the existing `Cache-Control: public, max-age=31536000, immutable` header — same as before.
- All `<Image>` component behaviour is preserved: `fill`, `sizes`, `priority`, lazy loading, `onError` handlers, LCP hints. Only the transformation step is removed.
- No component code changes needed.

## Changes

**`next.config.js` — images block:**

Remove keys that only apply when optimization is active: `formats`, `minimumCacheTTL`, `deviceSizes`, `imageSizes`.

Keep: `remotePatterns` (security allowlist, harmless to keep).

Add: `unoptimized: true`.

Result:
```js
images: {
  unoptimized: true,
  remotePatterns: [
    { protocol: 'https', hostname: '**' },
  ],
  dangerouslyAllowSVG: false,
},
```

## Files Changed

- `next.config.js` — images block only

## Files NOT Changed

- All `src/` component files — zero changes
- No product data, no catalogue content, no UI

## Success Criteria

- Build passes with zero errors
- `/_next/image` is no longer called in browser network tab
- All images render correctly on product pages, catalog, cart, search, admin
- Vercel Image Optimization usage stays at zero regardless of traffic
