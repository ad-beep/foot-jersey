'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const L = {
  title:         { en: 'Forgot Password',        he: 'שכחת סיסמה' },
  subtitle:      { en: "Enter your email and we'll send you a reset link", he: 'הכנס את האימייל שלך ונשלח קישור לאיפוס' },
  email:         { en: 'Email Address',           he: 'כתובת אימייל' },
  send:          { en: 'Send Reset Link',         he: 'שלח קישור לאיפוס' },
  back:          { en: 'Back to Sign In',         he: 'חזור להתחברות' },
  successTitle:  { en: 'Check Your Email',        he: 'בדוק את תיבת הדואר' },
  successDesc:   { en: "We've sent a password reset link to", he: 'שלחנו קישור לאיפוס סיסמה אל' },
  errInvalid:    { en: 'Invalid email address',   he: 'כתובת אימייל לא תקינה' },
  errNotFound:   { en: 'No account found with this email', he: 'לא נמצא חשבון עם האימייל הזה' },
  errGeneric:    { en: 'An error occurred. Please try again.', he: 'אירעה שגיאה. נסה שוב.' },
  spamNote:      { en: "Don't see it? Check your spam folder.", he: 'לא רואה? בדוק בתיקיית הספאם.' },
} as const;

export default function ForgotPasswordClient() {
  const { locale } = useLocale();
  const { toast } = useToast();
  const isHe = locale === 'he';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const t = (key: keyof typeof L) => isHe ? L[key].he : L[key].en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('errInvalid'));
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/user-not-found') {
        // For security, still show success to prevent user enumeration
        setSent(true);
      } else if (code === 'auth/invalid-email') {
        setError(t('errInvalid'));
      } else {
        setError(t('errGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)]';

  return (
    <div className="min-h-screen px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto pt-6">
        <Breadcrumbs
          items={[
            { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
            { label: isHe ? 'התחברות' : 'Sign In', href: `/${locale}/auth` },
            { label: t('title') },
          ]}
        />
      </div>

      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}
            />
            <span className="font-montserrat font-bold text-white text-xl tracking-tight">
              FootJersey
            </span>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'rgba(0,195,216,0.12)' }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="text-2xl font-bold text-white">{t('successTitle')}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('successDesc')} <strong className="text-white">{email}</strong>
              </p>
              <div
                className="p-3 rounded-lg text-xs"
                style={{ backgroundColor: 'rgba(0,195,216,0.06)', border: '1px solid rgba(0,195,216,0.15)', color: 'var(--text-secondary)' }}
              >
                <Mail className="w-4 h-4 inline mr-1.5" style={{ color: 'var(--accent)' }} />
                {t('spamNote')}
              </div>
              <Link
                href={`/${locale}/auth`}
                className="inline-flex items-center gap-2 text-sm mt-4 transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">{t('title')}</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="email@example.com"
                    className={cn(
                      inputClass,
                      error ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--accent)]'
                    )}
                    dir="ltr"
                    required
                    autoFocus
                  />
                  {error && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{error}</p>}
                </div>

                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                  {t('send')}
                </Button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
                <Link
                  href={`/${locale}/auth`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t('back')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
