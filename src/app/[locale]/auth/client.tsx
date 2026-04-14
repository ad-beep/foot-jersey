'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { cn } from '@/lib/utils';

// ─── Google "G" SVG ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// ─── Labels ──────────────────────────────────────────────────────
const L = {
  welcomeBack:   { en: 'Welcome Back',              he: 'ברוך שובך' },
  createAccount: { en: 'Create Account',             he: 'צור חשבון' },
  signInSub:     { en: 'Sign in to your account',    he: 'התחבר לחשבון שלך' },
  signUpSub:     { en: 'Create your FootJersey account', he: 'צור חשבון FootJersey' },
  google:        { en: 'Continue with Google',       he: 'המשך עם Google' },
  or:            { en: 'or',                         he: 'או' },
  email:         { en: 'Email',                      he: 'אימייל' },
  password:      { en: 'Password',                   he: 'סיסמה' },
  fullName:      { en: 'Full Name',                  he: 'שם מלא' },
  signIn:        { en: 'Sign In',                    he: 'התחבר' },
  signUp:        { en: 'Sign Up',                    he: 'הירשם' },
  noAccount:     { en: "Don't have an account?",     he: 'אין לך חשבון?' },
  hasAccount:    { en: 'Already have an account?',   he: 'כבר יש לך חשבון?' },
  forgotPass:    { en: 'Forgot password?',           he: 'שכחת סיסמה?' },
} as const;

// ─── Component ───────────────────────────────────────────────────
export default function AuthClient() {
  const router = useRouter();
  const { locale } = useLocale();
  const hydrated = useHydration();
  const { toast } = useToast();
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const isHe = locale === 'he';

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Redirect if already signed in
  useEffect(() => {
    if (hydrated && user) {
      router.replace(`/${locale}/profile`);
    }
  }, [hydrated, user, locale, router]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (mode === 'signUp' && !name.trim()) {
      next.name = isHe ? 'שם נדרש' : 'Name is required';
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      next.email = isHe ? 'אימייל לא תקין' : 'Invalid email address';
    }
    if (password.length < 6) {
      next.password = isHe ? 'סיסמה חייבת להכיל 6 תווים לפחות' : 'Password must be at least 6 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
        toast({ title: isHe ? 'התחברת בהצלחה' : 'Signed in successfully', variant: 'success' });
      } else {
        await signUpWithEmail(email, password);
        // Set display name on the newly created Firebase user
        if (auth.currentUser && name.trim()) {
          await updateProfile(auth.currentUser, { displayName: name.trim() });
          // Update Firestore doc
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name.trim() });
          } catch { /* Firestore may not be available in dev */ }
          // Update local store
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setUser({ ...currentUser, displayName: name.trim() });
          }
        }
        toast({ title: isHe ? 'החשבון נוצר בהצלחה' : 'Account created successfully', variant: 'success' });
      }
      router.push(`/${locale}/profile`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      let msg = isHe ? 'אירעה שגיאה. נסה שוב.' : 'An error occurred. Please try again.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        msg = isHe ? 'אימייל או סיסמה שגויים' : 'Invalid email or password';
      } else if (code === 'auth/email-already-in-use') {
        msg = isHe ? 'כתובת האימייל כבר בשימוש' : 'Email already in use';
      } else if (code === 'auth/too-many-requests') {
        msg = isHe ? 'יותר מדי ניסיונות. נסה מאוחר יותר.' : 'Too many attempts. Try again later.';
      }
      toast({ title: msg, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: isHe ? 'התחברת בהצלחה' : 'Signed in successfully', variant: 'success' });
      router.push(`/${locale}/profile`);
    } catch {
      toast({ title: isHe ? 'ההתחברות עם Google נכשלה' : 'Google sign-in failed', variant: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Don't render form while checking auth state
  if (!hydrated) return null;
  if (user) return null;

  const inputClass = 'w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)]';

  return (
    <div className="min-h-screen px-4" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto pt-6">
        <Breadcrumbs
          items={[
            { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
            { label: isHe ? 'התחברות' : 'Sign In' },
          ]}
        />
      </div>
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: 'var(--gold)', boxShadow: '0 0 10px rgba(200,162,75,0.6)' }}
          />
          <span className="font-playfair font-bold text-white text-xl tracking-tight">
            FootJersey
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {mode === 'signIn' ? (isHe ? L.welcomeBack.he : L.welcomeBack.en) : (isHe ? L.createAccount.he : L.createAccount.en)}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signIn' ? (isHe ? L.signInSub.he : L.signInSub.en) : (isHe ? L.signUpSub.he : L.signUpSub.en)}
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className={cn(
            'w-full h-12 rounded-lg flex items-center justify-center gap-3 font-semibold text-sm transition-all duration-200',
            'bg-white text-gray-800 hover:bg-gray-100 active:scale-[0.98]',
            googleLoading && 'opacity-50 cursor-not-allowed',
          )}
        >
          {googleLoading ? (
            <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <GoogleIcon />
              {isHe ? L.google.he : L.google.en}
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {isHe ? L.or.he : L.or.en}
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (sign-up only) */}
          {mode === 'signUp' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isHe ? L.fullName.he : L.fullName.en}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                className={cn(inputClass, errors.name ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--gold)]')}
                dir={isHe ? 'rtl' : 'ltr'}
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.name}</p>}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? L.email.he : L.email.en}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              className={cn(inputClass, errors.email ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--gold)]')}
              dir="ltr"
              required
            />
            {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {isHe ? L.password.he : L.password.en}
              </label>
              {mode === 'signIn' && (
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs transition-colors hover:underline"
                  style={{ color: 'var(--gold)' }}
                >
                  {isHe ? L.forgotPass.he : L.forgotPass.en}
                </Link>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              className={cn(inputClass, errors.password ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--gold)]')}
              dir="ltr"
              required
              minLength={6}
            />
            {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.password}</p>}
          </div>

          {/* Submit */}
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            {mode === 'signIn' ? (isHe ? L.signIn.he : L.signIn.en) : (isHe ? L.signUp.he : L.signUp.en)}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          {mode === 'signIn' ? (isHe ? L.noAccount.he : L.noAccount.en) : (isHe ? L.hasAccount.he : L.hasAccount.en)}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setErrors({}); }}
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'var(--gold)' }}
          >
            {mode === 'signIn' ? (isHe ? L.signUp.he : L.signUp.en) : (isHe ? L.signIn.he : L.signIn.en)}
          </button>
        </p>
      </div>
      </div>
    </div>
  );
}
