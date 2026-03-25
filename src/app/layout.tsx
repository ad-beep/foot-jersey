import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FootJersey — Premium Football Jerseys',
  description: 'Your destination for authentic football jerseys from every league around the world. Buying jerseys is an experience.',
  keywords: ['football jerseys', 'soccer jerseys', 'premier league', 'la liga', 'retro jerseys', 'חולצות כדורגל'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
