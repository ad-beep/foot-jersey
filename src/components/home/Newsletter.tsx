'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { Reveal } from '@/components/ui/reveal';

export function Newsletter() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: wire up to email service (Mailchimp, Resend, etc.)
    setSubmitted(true);
  };

  return (
    <section
      className="py-16"
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

          {submitted ? (
            <div
              className="px-6 py-4 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'rgba(15,61,46,0.3)', color: '#86efac', border: '1px solid rgba(15,61,46,0.5)' }}
            >
              {isHe ? '✓ נרשמת בהצלחה!' : '✓ You\'re in! Talk soon.'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isHe ? 'כתובת מייל שלך' : 'Your email address'}
                required
                className="flex-1 px-4 py-3 rounded-full text-sm text-white outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border)',
                  direction: isHe ? 'rtl' : 'ltr',
                }}
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-full text-sm font-semibold text-white shrink-0 transition-all duration-200"
                style={{ backgroundColor: 'var(--flare)', boxShadow: '0 0 20px var(--flare-glow)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--flare-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--flare)'; }}
              >
                {isHe ? 'הצטרף' : 'Join'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
