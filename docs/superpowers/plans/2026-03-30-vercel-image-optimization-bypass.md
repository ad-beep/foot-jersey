# Vercel Image Optimization Bypass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop all Vercel image transformation credit usage permanently by setting `unoptimized: true` in `next.config.js`.

**Architecture:** One config change in `next.config.js`. All `<Image>` components continue to work identically — `fill`, `sizes`, `priority`, lazy loading, `onError` handlers are all unaffected. Product images (Firebase Storage URLs) serve directly from Google's CDN. Local category `.webp` files serve from Vercel's edge CDN as static assets. Zero `/_next/image` calls will be made.

**Tech Stack:** Next.js 14, next.config.js

---

### Task 1: Disable image optimization globally

**Files:**
- Modify: `next.config.js` — images block only

The current images block:
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**' },
  ],
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 2592000,
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  dangerouslyAllowSVG: false,
},
```

- [ ] **Step 1: Replace the images block**

Open `next.config.js`. Replace the entire `images: { ... }` block with:

```js
images: {
  unoptimized: true,
  remotePatterns: [
    { protocol: 'https', hostname: '**' },
  ],
  dangerouslyAllowSVG: false,
},
```

`formats`, `minimumCacheTTL`, `deviceSizes`, and `imageSizes` are removed — they only apply when optimization is active and are dead config with `unoptimized: true`.

The full `next.config.js` after the edit:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    dangerouslyAllowSVG: false,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'firebase',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'resend',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/favicon.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/', destination: '/en' },
      { source: '/favicon.ico', destination: '/favicon.svg' },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

Expected: build completes with exit code 0, no errors. Next.js will print a warning like `Image Optimization using Next.js' default loader is disabled` — this is expected and correct.

- [ ] **Step 3: Spot-check in dev**

```bash
npm run dev
```

Open the browser. Visit the home page, a category page, and a product page. Open DevTools → Network → Img filter. Confirm that image requests go directly to `firebasestorage.googleapis.com` (or similar Firebase/Google URLs) — NOT to `/_next/image?url=...`. This confirms Vercel's optimization service is completely bypassed.

- [ ] **Step 4: Commit and push**

```bash
git add next.config.js
git commit -m "fix: disable vercel image optimization to eliminate transformation credit usage"
git push origin main
```
