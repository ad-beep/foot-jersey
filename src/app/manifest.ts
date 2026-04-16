import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FootJersey — Premium Football Jerseys',
    short_name: 'FootJersey',
    description: 'Shop premium football jerseys from every league. Fast shipping to Israel.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#C8A24B',
    orientation: 'portrait-primary',
    categories: ['shopping', 'sports'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
  };
}
