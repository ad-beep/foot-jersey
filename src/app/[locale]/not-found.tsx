'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  const isHe = pathname?.startsWith('/he');
  const locale = isHe ? 'he' : 'en';

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: 'var(--ink)' }}
    >
      {/* Giant faint number */}
      <div
        className="font-playfair font-bold select-none pointer-events-none absolute"
        style={{
          fontSize: 'clamp(14rem, 38vw, 28rem)',
          color: 'rgba(200,162,75,0.05)',
          letterSpacing: '-0.06em',
          lineHeight: 0.85,
          userSelect: 'none',
        }}
        aria-hidden="true"
      >
        404
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <p className="section-kicker">{isHe ? 'שגיאה' : 'Error'}</p>

        <h1
          className="font-playfair font-bold text-white"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 0.9 }}
        >
          {isHe ? 'דף לא\nנמצא.' : 'Page not\nfound.'}
        </h1>

        <p
          className="font-mono text-[12px] uppercase tracking-[0.2em] max-w-[28ch]"
          style={{ color: 'var(--muted)' }}
        >
          {isHe
            ? 'הדף שחיפשת לא קיים או הועבר לכתובת אחרת.'
            : 'The page you were looking for doesn\'t exist or has moved.'}
        </p>

        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: 'var(--flare)', boxShadow: '0 0 28px rgba(255,77,46,0.35)' }}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d={isHe ? 'M13 8H3M7 4l-4 4 4 4' : 'M3 8h10M9 4l4 4-4 4'} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isHe ? 'חזור לדף הבית' : 'Back to Home'}
        </Link>
      </div>
    </div>
  );
}
