'use client';

import { useState } from 'react';
import { Copy, Smartphone, CheckCircle2, User, Phone, Banknote } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
    window.location.href = bitDeepLink;
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
    if (!validateSenderFields()) return;
    setConfirmed(true);
    onConfirm({
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      amountPaid: String(amount),
    });
  };

  if (confirmed) {
    return (
      <div className="text-center space-y-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: 'rgba(0,195,216,0.12)' }}
        >
          <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
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

  const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-all duration-200';

  return (
    <div className="space-y-4">
      {/* Owner Details - Send payment to */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ backgroundColor: 'rgba(0,195,216,0.06)', border: '1px solid rgba(0,195,216,0.2)' }}
      >
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
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
                  ? 'rgba(0,195,216,0.2)'
                  : 'rgba(255,255,255,0.06)',
                color: copied ? 'var(--accent)' : 'var(--text-muted)',
              }}
              title={isHe ? 'העתק' : 'Copy'}
            >
              <Copy className="w-4 h-4" />
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
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <QRCodeSVG
            value={qrValue}
            size={130}
            level="H"
            includeMargin
            fgColor="#ffffff"
            bgColor="transparent"
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
          backgroundColor: 'rgba(0,195,216,0.2)',
          color: 'var(--accent)',
          border: '1px solid var(--accent)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,195,216,0.3)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,195,216,0.2)';
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
              backgroundColor: 'rgba(0,195,216,0.08)',
              border: '1px solid rgba(0,195,216,0.3)',
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
        className="w-full py-3 rounded-xl font-bold text-base text-white transition-all duration-200 disabled:opacity-60"
        style={{ backgroundColor: 'var(--cta)' }}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.9';
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
