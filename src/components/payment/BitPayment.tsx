'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Smartphone, CheckCircle2, User, Phone, Banknote, Clock, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const BIT_EXPIRY_SECONDS = 15 * 60; // 15 minutes

interface BitPaymentProps {
  amount: number;
  isHe: boolean;
  isRtl: boolean;
  onConfirm: (senderDetails: BitSenderDetails) => void;
  loading: boolean;
}

export interface BitSenderDetails {
  senderName: string;
  senderPhone: string;
  amountPaid: string;
}

export function BitPayment({
  amount,
  isHe,
  isRtl,
  onConfirm,
  loading,
}: BitPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [secondsLeft, setSecondsLeft] = useState(BIT_EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const submittingRef = useRef(false);

  // Countdown timer — 15 minutes to complete the Bit transfer
  useEffect(() => {
    if (confirmed || expired) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [confirmed, expired]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }, []);

  // Owner details
  const ownerPhone = '058-414-0508';
  const ownerCleanPhone = '0584140508';
  const ownerName = isHe ? 'אדיב חזאן' : 'Adib Hazzan';

  // Deep link for Bit app
  const bitDeepLink = `bit://pay?phone=${ownerCleanPhone}&amount=${amount}&note=FootJersey+Order`;
  const qrValue = bitDeepLink;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(ownerPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeepLink = () => {
    // Open in new tab so the user keeps the confirmation form open
    window.open(bitDeepLink, '_blank', 'noopener,noreferrer');
  };

  const validateSenderFields = (): boolean => {
    const e: typeof errors = {};
    if (!senderName.trim()) e.name = isHe ? 'שם השולח נדרש' : 'Sender name is required';
    if (!senderPhone.trim()) e.phone = isHe ? 'טלפון השולח נדרש' : 'Sender phone is required';
    else if (!/^[\d\-+() ]{7,15}$/.test(senderPhone.trim())) e.phone = isHe ? 'מספר טלפון לא תקין' : 'Invalid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (submittingRef.current || loading) return;
    if (!validateSenderFields()) return;
    submittingRef.current = true;
    // Mark confirmed only after validation passes — the parent will redirect
    // on success or drop loading=false on error (useEffect above resets the ref).
    setConfirmed(true);
    onConfirm({
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      amountPaid: String(amount),
    });
  };

  // When the parent's loading flag drops back to false WHILE we are in a
  // "confirmed + submitting" state, the order save failed (redirect never happened).
  // Reset so the user can correct details and retry.
  // We only care about transitions from true→false when submittingRef is set,
  // so we track the previous value of `loading` to avoid spurious resets.
  const prevLoadingRef = useRef(loading);
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;
    // Only reset when loading transitions from true → false after we submitted
    if (wasLoading && !loading && submittingRef.current) {
      submittingRef.current = false;
      setConfirmed(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (confirmed) {
    return (
      <div className="text-center space-y-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: 'rgba(200,162,75,0.12)' }}
        >
          <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--gold)' }} />
        </div>
        <p className="text-sm text-white font-medium">
          {isHe ? 'ההזמנה התקבלה!' : 'Order Received!'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isHe
            ? 'אנחנו ממתינים לאישור התשלום. תקבל אימייל ברגע שנאשר את ההעברה.'
            : 'We are waiting for payment confirmation. You will receive an email once we approve the transfer.'}
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="text-center space-y-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: 'rgba(255,77,46,0.12)' }}
        >
          <AlertTriangle className="w-6 h-6" style={{ color: '#FF4D2E' }} />
        </div>
        <p className="text-sm text-white font-medium">
          {isHe ? 'פג תוקף הזמן' : 'Session Expired'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isHe
            ? '15 הדקות להעברה עברו. אנא התחל מחדש.'
            : 'The 15-minute window has passed. Please start again.'}
        </p>
        <button
          onClick={() => {
            setExpired(false);
            setSecondsLeft(BIT_EXPIRY_SECONDS);
            setSenderName('');
            setSenderPhone('');
            setErrors({});
          }}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid var(--border)' }}
        >
          {isHe ? 'התחל מחדש' : 'Start Again'}
        </button>
      </div>
    );
  }

  const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-all duration-200';

  return (
    <div className="space-y-4">
      {/* Countdown Timer */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg"
        style={{
          backgroundColor: secondsLeft < 120 ? 'rgba(255,77,46,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${secondsLeft < 120 ? 'rgba(255,77,46,0.3)' : 'var(--border)'}`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: secondsLeft < 120 ? '#FF4D2E' : 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: secondsLeft < 120 ? '#FF4D2E' : 'var(--text-muted)' }}>
            {isHe ? 'זמן שנותר להעברה' : 'Time remaining to transfer'}
          </span>
        </div>
        <span
          className="font-mono text-sm font-bold"
          style={{ color: secondsLeft < 120 ? '#FF4D2E' : 'white' }}
        >
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Owner Details - Send payment to */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ backgroundColor: 'rgba(200,162,75,0.06)', border: '1px solid rgba(200,162,75,0.2)' }}
      >
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>
          {isHe ? 'שלח תשלום אל' : 'Send Payment To'}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-semibold">{ownerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={ownerPhone}
              readOnly
              aria-label={isHe ? 'מספר טלפון לתשלום Bit' : 'Bit payment phone number'}
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'white',
                direction: 'ltr',
              }}
            />
            <button
              onClick={handleCopyPhone}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: copied
                  ? 'rgba(200,162,75,0.2)'
                  : 'rgba(255,255,255,0.06)',
                color: copied ? 'var(--gold)' : 'var(--text-muted)',
              }}
              aria-label={copied
                ? (isHe ? 'הועתק!' : 'Copied!')
                : (isHe ? 'העתק מספר טלפון' : 'Copy phone number')}
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-base font-bold text-white">
            {isHe ? 'סכום להעברה' : 'Amount'}: ₪{amount}
          </p>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: '#ffffff' }}
        >
          <QRCodeSVG
            value={qrValue}
            size={130}
            level="H"
            includeMargin={false}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          {isHe ? 'סרוק בעזרת אפליקציית Bit' : 'Scan with Bit app'}
        </p>
      </div>

      {/* Deep Link Button */}
      <button
        onClick={handleDeepLink}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          backgroundColor: 'rgba(200,162,75,0.12)',
          color: 'var(--gold)',
          border: '1px solid rgba(200,162,75,0.35)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(200,162,75,0.22)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(200,162,75,0.12)';
        }}
      >
        <Smartphone className="w-4 h-4" />
        {isHe ? 'פתח את Bit' : 'Open Bit App'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
        <span className="text-xs font-bold uppercase">
          {isHe ? 'אישור שליחת התשלום' : 'Confirm Payment Sent'}
        </span>
        <div className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      {/* Sender Details Form */}
      <div className="space-y-3">
        {/* Sender Name */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            <User className="w-3 h-3" />
            {isHe ? 'שם השולח *' : 'Sender Name *'}
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => { setSenderName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
            placeholder={isHe ? 'השם כפי שמופיע באפליקציית Bit' : 'Name as it appears in Bit app'}
            className={inputClass}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${errors.name ? '#FF4D6D' : 'var(--border)'}`,
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.name}</p>}
        </div>

        {/* Sender Phone */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Phone className="w-3 h-3" />
            {isHe ? 'טלפון השולח *' : 'Sender Phone *'}
          </label>
          <input
            type="tel"
            value={senderPhone}
            onChange={(e) => { setSenderPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
            placeholder="050-123-4567"
            className={inputClass}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${errors.phone ? '#FF4D6D' : 'var(--border)'}`,
              direction: 'ltr',
            }}
          />
          {errors.phone && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.phone}</p>}
        </div>

        {/* Amount Paid — fixed, matches order total */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Banknote className="w-3 h-3" />
            {isHe ? 'סכום להעברה (₪)' : 'Amount to Transfer (₪)'}
          </label>
          <div
            className="w-full rounded-lg px-3 py-2.5 text-sm font-bold text-white"
            style={{
              backgroundColor: 'rgba(200,162,75,0.08)',
              border: '1px solid rgba(200,162,75,0.3)',
              direction: 'ltr',
            }}
          >
            ₪{amount}
          </div>
        </div>
      </div>

      {/* Confirmation Button */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-60"
        style={{ backgroundColor: 'var(--gold)', color: '#0A0A0B' }}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.88';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
        }}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
        ) : isHe ? (
          'שלחתי את התשלום ב-Bit'
        ) : (
          "I've Sent the Payment via Bit"
        )}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        {isHe
          ? 'ההזמנה תטופל לאחר אישור התשלום על ידי הצוות שלנו'
          : 'Your order will be processed after our team confirms the payment'}
      </p>
    </div>
  );
}
