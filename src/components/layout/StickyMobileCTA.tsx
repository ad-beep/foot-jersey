'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useCartStore } from '@/stores/cart-store';

export function StickyMobileCTA() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [visible, setVisible] = useState(false);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const cartCount = useCartStore((s) => s.items.length);

  useEffect(() => {
    const threshold = document.documentElement.scrollHeight * 0.5;
    const handler = () => {
      setVisible(window.scrollY > threshold || window.scrollY > 400);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ backgroundColor: 'rgba(10,10,11,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)' }}
      >
        {/* Shop CTA */}
        <Link
          href={`/${locale}/discover`}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-95"
          style={{ backgroundColor: 'var(--flare)', color: '#fff' }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {isHe ? 'קנה עכשיו' : 'Shop Jerseys'}
        </Link>

        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative h-12 w-12 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 shrink-0"
          style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          aria-label="Open cart"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {cartCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-black"
              style={{ backgroundColor: 'var(--gold)' }}
            >
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
