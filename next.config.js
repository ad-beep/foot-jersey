/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Sporthub / any Shopify-hosted store
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.shopify.com' },
      // Firebase Storage (user-uploaded images)
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // Catch-all for any other CDN the image sheet may reference
      { protocol: 'https', hostname: '**' },
    ],
    // Smaller breakpoints reduce download size on mobile product cards
    deviceSizes: [320, 384, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // CDN URLs from Shopify are versioned — 30-day cache is safe
    minimumCacheTTL: 2592000,
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
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
      { source: '/favicon.ico', destination: '/favicon.svg' },
    ];
  },
};

module.exports = nextConfig;
