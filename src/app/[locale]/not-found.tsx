'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  const isHe = pathname?.startsWith('/he');
  const locale = isHe ? 'he' : 'en';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center bg-black">
      <h1 className="mb-2 text-6xl font-bold text-white">404</h1>
      <p className="mb-8 text-lg text-gray-400">
        {isHe ? 'הדף לא נמצא' : 'Page not found'}
      </p>
      <Link
        href={`/${locale}`}
        className="rounded-lg bg-cyan-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
      >
        {isHe ? 'חזור הביתה' : 'Go Home'}
      </Link>
    </div>
  );
}
