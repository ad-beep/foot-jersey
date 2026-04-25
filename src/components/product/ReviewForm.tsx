'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Check, Star } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  jerseyId: string;
  jerseyName: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ open, onClose, jerseyId, jerseyName, onSubmitted }: ReviewFormProps) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStatus('idle');
      setErrorMsg('');
      setTimeout(() => firstInputRef.current?.focus(), 50);
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

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!rating) {
      setErrorMsg(isHe ? 'בחר דירוג כוכבים' : 'Please select a star rating');
      setStatus('error');
      return;
    }
    if (text.trim().length < 10) {
      setErrorMsg(isHe ? 'הכתוב קצר מדי (לפחות 10 תווים)' : 'Review too short (min 10 characters)');
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: Number(orderNumber),
          email: email.trim(),
          jerseyId,
          rating,
          text: text.trim(),
          city: city.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgMap: Record<string, { en: string; he: string }> = {
          'Order not found':                  { en: "We couldn't find that order.",                       he: 'לא מצאנו הזמנה כזו.' },
          'Order not found for that email':   { en: "That email doesn't match the order.",                he: 'האימייל לא תואם להזמנה.' },
          'This jersey is not in that order': { en: "This jersey isn't on that order — nice try 😅",      he: 'החולצה הזו לא בהזמנה הזו.' },
          'You already reviewed this jersey for this order.': {
            en: 'You already reviewed this jersey for this order.',
            he: 'כבר כתבת ביקורת על החולצה הזו מההזמנה הזו.',
          },
        };
        const mapped = msgMap[data.error];
        setErrorMsg(mapped ? (isHe ? mapped.he : mapped.en) : (data.error || (isHe ? 'שגיאה.' : 'Something went wrong.')));
        setStatus('error');
        return;
      }
      setStatus('done');
      onSubmitted?.();
    } catch {
      setErrorMsg(isHe ? 'שגיאת רשת. נסה שוב.' : 'Network error. Try again.');
      setStatus('error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isHe ? 'כתוב ביקורת' : 'Write a review'}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className={`flex items-center gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
            <Star className="w-4 h-4" fill="currentColor" style={{ color: '#FFBE32' }} />
            <h2 className="text-sm font-bold text-white">
              {isHe ? 'כתוב ביקורת' : 'Write a review'}
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
            <p className="text-sm font-semibold text-white mb-1">
              {isHe ? 'תודה על הביקורת!' : 'Thanks for the review!'}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isHe ? 'היא תופיע בדף המוצר בקרוב.' : "It's live on the product page."}
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
              {isHe ? 'סגור' : 'Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3 overflow-y-auto">
            <p className="text-sm text-white font-semibold">{jerseyName}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isHe
                ? 'רק לקוחות שקנו את החולצה הזו יכולים להשאיר ביקורת. הזן את מספר ההזמנה והאימייל לאימות.'
                : 'Only buyers of this jersey can leave a review. Enter your order number and email to verify.'}
            </p>

            {/* Stars */}
            <div>
              <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                {isHe ? 'דירוג' : 'Rating'}
              </label>
              <div className={`flex items-center gap-1 ${isHe ? 'flex-row-reverse' : ''}`}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (hoverRating || rating) >= n;
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="w-9 h-9 flex items-center justify-center transition-transform hover:scale-110"
                      aria-label={`${n} ${isHe ? 'כוכבים' : 'stars'}`}
                    >
                      <Star
                        className="w-6 h-6"
                        fill={active ? '#FFBE32' : 'transparent'}
                        style={{ color: active ? '#FFBE32' : 'rgba(255,190,50,0.4)' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order number + Email */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                  {isHe ? 'מספר הזמנה' : 'Order #'}
                </label>
                <input
                  ref={firstInputRef}
                  type="number"
                  min={1}
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="123"
                  className="w-full h-10 rounded-lg px-3 text-sm text-white outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                  {isHe ? 'אימייל' : 'Email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-10 rounded-lg px-3 text-xs text-white outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                  dir={isHe ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Review text */}
            <div>
              <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                {isHe ? 'הביקורת שלך' : 'Your review'}
              </label>
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isHe ? 'ספר איך הגיעה החולצה, האיכות, המידה…' : 'Tell us how the jersey arrived, quality, fit…'}
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                dir={isHe ? 'rtl' : 'ltr'}
              />
              <p className="text-[10px] text-end mt-1" style={{ color: 'var(--muted)' }}>
                {text.length}/1000
              </p>
            </div>

            {/* City (optional) */}
            <div>
              <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                {isHe ? 'עיר (אופציונלי)' : 'City (optional)'}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={isHe ? 'תל אביב' : 'Tel Aviv'}
                maxLength={60}
                className="w-full h-10 rounded-lg px-3 text-sm text-white outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                dir={isHe ? 'rtl' : 'ltr'}
              />
            </div>

            {status === 'error' && errorMsg && (
              <p className="text-xs" style={{ color: '#ff7a5c' }}>{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full h-11 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              style={{
                backgroundColor: 'var(--flare)',
                color: '#fff',
                boxShadow: '0 0 18px rgba(255,77,46,0.25)',
              }}
            >
              {status === 'sending' ? (isHe ? 'שולח…' : 'Submitting…') : (isHe ? 'פרסם ביקורת' : 'Submit review')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
