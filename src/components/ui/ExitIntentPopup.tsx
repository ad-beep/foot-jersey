'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

const DISCOUNT_CODE = 'STAY10';
const SESSION_KEY = 'exit_popup_shown';
const STORAGE_KEY = 'exit_discount_code';

export function ExitIntentPopup() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const isHe = locale === 'he';

  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const show = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't interrupt anyone mid-purchase or who already claimed the code.
    const path = window.location.pathname;
    if (/\/(cart|checkout|order-confirmed)(\/|$)/.test(path)) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const mountTime = Date.now();
    let fired = false;

    const fire = () => {
      if (fired) return;
      fired = true;
      cleanup();
      show();
    };

    // 1) Welcome timer — early enough to catch a quick bounce, late enough not
    //    to interrupt someone still getting oriented.
    const timer = setTimeout(fire, 6000);

    // 2) Engagement signal — if they scroll past the hero (and at least ~2.5s
    //    in), they're interested; show the offer now rather than waiting.
    const onScroll = () => {
      if (Date.now() - mountTime > 2500 && window.scrollY > window.innerHeight * 0.6) fire();
    };

    // 3) Desktop fallback — classic exit-intent if they reach for the tab bar.
    const onMouseLeave = (e: MouseEvent) => { if (e.clientY < 10) fire(); };

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeave);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return cleanup;
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    try {
      await fetch('/api/exit-intent/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
    // Store discount code for auto-apply at checkout
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, DISCOUNT_CODE);
    }
    setSubmitted(true);
    setTimeout(hide, 3000);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) hide(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          backgroundColor: 'var(--ink)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        dir={isHe ? 'rtl' : 'ltr'}
      >
        {/* Close */}
        <button
          onClick={hide}
          className="absolute top-4 end-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ color: 'var(--muted)', backgroundColor: 'rgba(255,255,255,0.05)' }}
          aria-label={isHe ? 'סגור' : 'Close'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Discount badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wide mb-5"
          style={{ backgroundColor: 'rgba(200,162,75,0.12)', border: '1px solid rgba(200,162,75,0.3)', color: 'var(--gold)' }}
        >
          🏷️ {isHe ? '10% הנחה' : '10% Off'}
        </div>

        {submitted ? (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(200,162,75,0.12)', border: '2px solid rgba(200,162,75,0.3)' }}
            >
              <svg className="w-7 h-7" style={{ color: 'var(--gold)' }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-playfair font-bold text-white text-2xl mb-2">
              {isHe ? 'קוד ההנחה שלך' : 'Your discount code'}
            </h2>
            <div
              className="inline-block px-6 py-3 rounded-xl font-mono font-black text-xl tracking-widest mb-3"
              style={{ backgroundColor: 'rgba(200,162,75,0.1)', border: '1px solid rgba(200,162,75,0.35)', color: 'var(--gold)' }}
            >
              {DISCOUNT_CODE}
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isHe ? 'הזן את הקוד בקופה — תקף על ההזמנה הראשונה בלבד' : 'Enter it at checkout — valid on your first order only'}
            </p>
          </>
        ) : (
          <>
            <h2
              className="font-playfair font-bold text-white mb-2"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 1.9rem)', letterSpacing: '-0.03em' }}
            >
              {isHe ? 'ברוך הבא — קבל 10% הנחה' : 'Welcome — here\'s 10% off'}
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              {isHe
                ? 'מתנת הצטרפות ללקוחות חדשים — 10% הנחה על ההזמנה הראשונה שלך. הזן אימייל וקבל את הקוד.'
                : 'A welcome gift for new customers — 10% off your first order. Drop your email and grab the code.'}
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--muted)', opacity: 0.7 }}>
              {isHe
                ? 'הקוד תקף פעם אחת, על ההזמנה הראשונה בלבד.'
                : 'Valid once, on your first order only.'}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isHe ? 'האימייל שלך' : 'your@email.com'}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[rgba(200,162,75,0.4)]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  direction: 'ltr',
                }}
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full h-12 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: 'var(--gold)', color: '#000' }}
              >
                {loading
                  ? (isHe ? 'שולח...' : 'Sending...')
                  : (isHe ? 'קבל 10% הנחה' : 'Claim 10% Off')}
              </button>
            </form>
            <button
              onClick={hide}
              className="mt-3 text-xs transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {isHe ? 'לא תודה, אני אשלם מחיר מלא' : "No thanks, I'll pay full price"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
