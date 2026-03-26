import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FootJersey — Premium Football Jerseys | חולצות כדורגל',
    template: '%s | FootJersey',
  },
  description: 'Shop premium football jerseys from every league worldwide. Premier League, La Liga, Serie A, Bundesliga, retro classics, World Cup 2026 and more. Fast shipping to Israel.',
  keywords: ['football jerseys', 'soccer jerseys', 'premier league', 'la liga', 'serie a', 'bundesliga', 'retro jerseys', 'world cup 2026', 'חולצות כדורגל', 'חולצות כדורגל פרימיום', 'foot jersey'],
  metadataBase: new URL('https://shopfootjersey.com'),
  openGraph: {
    title: 'FootJersey — Premium Football Jerseys',
    description: 'Shop premium football jerseys from every league worldwide. Buying jerseys is an experience.',
    siteName: 'FootJersey',
    locale: 'en_US',
    alternateLocale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FootJersey — Premium Football Jerseys',
    description: 'Shop premium football jerseys from every league worldwide.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
