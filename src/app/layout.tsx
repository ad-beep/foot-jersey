import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
  },
  title: {
    default: 'FootJersey — Premium Football Jerseys | חולצות כדורגל פרמיום',
    template: '%s | FootJersey',
  },
  description:
    "FootJersey — Israel's top online store for premium football jerseys. Shop all leagues: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Israeli League, Retro Classics, World Cup 2026, Drip, Stussy, and more. Secure PayPal & BIT payments. Fast delivery across Israel. חולצות כדורגל פרמיום לכל אוהד.",
  keywords: [
    // English
    'football jerseys', 'soccer jerseys', 'buy football jersey Israel',
    'premier league jersey', 'la liga jersey', 'serie a jersey',
    'bundesliga jersey', 'ligue 1 jersey', 'retro football jerseys',
    'world cup 2026 jersey', 'kids football jersey', 'drip jersey',
    'stussy jersey', 'football jersey online', 'football kit Israel',
    'cheap football jerseys', 'authentic football jerseys',
    'football jersey store Israel', 'where to buy football jersey Israel',
    // Hebrew
    'חולצות כדורגל', 'חולצות כדורגל פרמיום', 'חולצת כדורגל',
    'קנה חולצת כדורגל', 'חולצות ליגת האלופות', 'חולצות פרמיירליג',
    'חולצות כדורגל ישראל', 'חולצות רטרו', 'חולצות מונדיאל 2026',
    'חולצות ילדים כדורגל', 'FootJersey',
  ],
  metadataBase: new URL('https://shopfootjersey.com'),
  alternates: {
    canonical: 'https://shopfootjersey.com',
    languages: {
      en: 'https://shopfootjersey.com/en',
      he: 'https://shopfootjersey.com/he',
      'x-default': 'https://shopfootjersey.com/en',
    },
  },
  openGraph: {
    title: 'FootJersey — Premium Football Jerseys | Israel',
    description:
      'Shop premium football jerseys from every league worldwide. Premier League, La Liga, Serie A, Bundesliga, Retro Classics, World Cup 2026. Fast delivery across Israel.',
    siteName: 'FootJersey',
    locale: 'en_US',
    alternateLocale: 'he_IL',
    type: 'website',
    url: 'https://shopfootjersey.com',
    images: [
      {
        url: 'https://shopfootjersey.com/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'FootJersey — Premium Football Jerseys',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FootJersey — Premium Football Jerseys | Israel',
    description:
      'Shop premium football jerseys from every league worldwide. Fast delivery across Israel.',
    images: ['https://shopfootjersey.com/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'shopping',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
