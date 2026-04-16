'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocale } from '@/hooks/useLocale';
import { Reveal } from '@/components/ui/reveal';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'invalid';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function Newsletter() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus('invalid');
      return;
    }
    setStatus('loading');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Check for duplicates before inserting
      const existing = await getDocs(
        query(collection(db, 'newsletterEmails'), where('email', '==', normalizedEmail))
      );
      if (existing.empty) {
        await addDoc(collection(db, 'newsletterEmails'), {
          email: normalizedEmail,
          locale,
          subscribedAt: serverTimestamp(),
        });
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section
      className="py-16"
      aria-label={isHe ? 'הרשמה לניוזלטר' : 'Newsletter signup'}
      style={{ backgroundColor: 'var(--steel)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-[700px] mx-auto px-4 md:px-6 text-center">
        <Reveal>
          <p className="section-kicker mb-3">
            {isHe ? 'הישאר מעודכן' : 'The Teamsheet'}
          </p>
          <h2
            className="font-playfair font-bold text-white mb-3"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.03em' }}
          >
            {isHe ? 'הגיע הזמן ללוק חדש.' : 'New drops. First access.'}
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {isHe
              ? 'קבל גישה ראשונה לדרופים חדשים, מלאי מחודש של רטרו, והנחות ימי משחק.'
              : 'Get first access to new drops, retro restocks, and matchday discounts.'}
          </p>

          {status === 'success' ? (
            <div
              role="status"
              className="px-6 py-4 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'rgba(15,61,46,0.3)', color: '#86efac', border: '1px solid rgba(15,61,46,0.5)' }}
            >
              {isHe ? '✓ נרשמת בהצלחה!' : "✓ You're in! Talk soon."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
              <div className="flex gap-3 w-full max-w-md">
                <label htmlFor="newsletter-email" className="sr-only">
                  {isHe ? 'כתובת מייל' : 'Email address'}
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === 'error' || status === 'invalid') setStatus('idle'); }}
                  placeholder={isHe ? 'כתובת מייל שלך' : 'Your email address'}
                  required
                  disabled={status === 'loading'}
                  className="flex-1 px-4 py-3 rounded-full text-sm text-white outline-none disabled:opacity-60"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: (status === 'error' || status === 'invalid') ? '1px solid var(--flare)' : '1px solid var(--border)',
                    direction: isHe ? 'rtl' : 'ltr',
                    transition: 'border-color 0.2s',
                  }}
                  aria-invalid={status === 'error' || status === 'invalid'}
                  aria-describedby={status === 'error' || status === 'invalid' ? 'newsletter-error' : undefined}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  aria-label={status === 'loading' ? (isHe ? 'שולח...' : 'Submitting…') : undefined}
                  className="px-5 py-3 rounded-full text-sm font-semibold text-white shrink-0 transition-all duration-200 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--flare)', boxShadow: '0 0 20px var(--flare-glow)' }}
                  onMouseEnter={(e) => { if (status !== 'loading') (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--flare-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--flare)'; }}
                >
                  {status === 'loading' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      {isHe ? 'שולח' : 'Joining'}
                    </span>
                  ) : (isHe ? 'הצטרף' : 'Join')}
                </button>
              </div>
              {status === 'invalid' && (
                <p
                  id="newsletter-error"
                  role="alert"
                  className="text-xs"
                  style={{ color: 'var(--flare)' }}
                >
                  {isHe ? 'אנא הזן כתובת אימייל תקינה.' : 'Please enter a valid email address.'}
                </p>
              )}
              {status === 'error' && (
                <p
                  id="newsletter-error"
                  role="alert"
                  className="text-xs"
                  style={{ color: 'var(--flare)' }}
                >
                  {isHe ? 'משהו השתבש. נסה שוב.' : 'Something went wrong. Please try again.'}
                </p>
              )}
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
