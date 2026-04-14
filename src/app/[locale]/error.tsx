'use client';

import { usePathname } from 'next/navigation';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const isHe = pathname?.startsWith('/he');
  const homeHref = isHe ? '/he' : '/en';

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
          color: 'rgba(255,77,46,0.04)',
          letterSpacing: '-0.06em',
          lineHeight: 0.85,
        }}
        aria-hidden="true"
      >
        500
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <p className="section-kicker">{isHe ? 'שגיאה' : 'Error'}</p>

        <h1
          className="font-playfair font-bold text-white"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 0.9 }}
        >
          {isHe ? 'משהו\nהשתבש.' : 'Something\nwent wrong.'}
        </h1>

        <p
          className="font-mono text-[12px] uppercase tracking-[0.2em] max-w-[28ch]"
          style={{ color: 'var(--muted)' }}
        >
          {isHe ? 'אירעה שגיאה בלתי צפויה. נסה שוב.' : 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
            style={{ backgroundColor: 'var(--flare)', boxShadow: '0 0 28px rgba(255,77,46,0.35)' }}
          >
            {isHe ? 'נסה שוב' : 'Try Again'}
          </button>
          <a
            href={homeHref}
            className="px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/[0.06]"
            style={{ color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {isHe ? 'דף הבית' : 'Go Home'}
          </a>
        </div>
      </div>
    </div>
  );
}
