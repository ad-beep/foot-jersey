'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Bell, Check } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import type { Size } from '@/types';

interface StockAlertModalProps {
  open: boolean;
  onClose: () => void;
  jerseyId: string;
  jerseyName: string;
  size: Size | null;
}

export function StockAlertModal({ open, onClose, jerseyId, jerseyName, size }: StockAlertModalProps) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStatus('idle');
      setErrorMsg('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !size) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg(isHe ? 'אימייל לא תקין' : 'Invalid email');
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), jerseyId, size }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('done');
    } catch {
      setErrorMsg(isHe ? 'משהו השתבש, נסה שוב' : 'Something went wrong, try again');
      setStatus('error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isHe ? 'קבל התראה כשחוזר למלאי' : 'Get a back-in-stock alert'}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className={`flex items-center gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
            <Bell className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            <h2 className="text-sm font-bold text-white">
              {isHe ? 'קבל התראה' : 'Get notified'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/5"
            aria-label={isHe ? 'סגור' : 'Close'}
          >
            <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        {status === 'done' ? (
          <div className="p-6 text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}
            >
              <Check className="w-5 h-5" style={{ color: '#4ade80' }} />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {isHe ? 'שמרנו את הבקשה שלך' : "You're on the list"}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isHe
                ? `נשלח אליך אימייל ברגע שמידה ${size} חוזרת למלאי.`
                : `We'll email you the moment size ${size} is back in stock.`}
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full h-11 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: 'rgba(200,162,75,0.12)',
                color: 'var(--gold)',
                border: '1px solid rgba(200,162,75,0.4)',
              }}
            >
              {isHe ? 'סגור' : 'Done'}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5">
            <p className="text-sm mb-1 text-white font-medium">
              {jerseyName} · {isHe ? 'מידה' : 'Size'} {size}
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              {isHe
                ? 'מידה זו אזלה. הזן אימייל ונעדכן אותך ברגע שחוזרת למלאי.'
                : "This size is out of stock. Drop your email and we'll ping you the second it's back."}
            </p>
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder={isHe ? 'האימייל שלך' : 'you@example.com'}
              className="w-full h-11 rounded-lg px-3 text-sm text-white outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: `1px solid ${status === 'error' ? 'rgba(255,77,46,0.5)' : 'var(--border)'}`,
              }}
              dir={isHe ? 'rtl' : 'ltr'}
            />
            {status === 'error' && errorMsg && (
              <p className="text-xs mt-2" style={{ color: '#ff7a5c' }}>{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="mt-4 w-full h-11 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              style={{
                backgroundColor: 'var(--flare)',
                color: '#fff',
                boxShadow: '0 0 18px rgba(255,77,46,0.25)',
              }}
            >
              {status === 'sending'
                ? (isHe ? 'שולח…' : 'Sending…')
                : (isHe ? 'הודיעו לי' : 'Notify me')}
            </button>
            <p className="text-[10px] mt-3 text-center" style={{ color: 'var(--muted)' }}>
              {isHe ? 'ללא ספאם. רק התראה אחת כשמשהו משתנה.' : 'No spam. Just one email when it changes.'}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
