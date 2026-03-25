'use client';

import { useState } from 'react';
import { Copy, Smartphone, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BitPaymentProps {
  amount: number;
  isHe: boolean;
  isRtl: boolean;
  onConfirm: () => void;
  loading: boolean;
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

  const phoneNumber = '058-414-0508';
  const cleanPhoneNumber = '0584140508';

  // Deep link for Bit app
  const bitDeepLink = `bit://pay?phone=${cleanPhoneNumber}&amount=${amount}&note=FootJersey+Order`;

  // QR code value
  const qrValue = bitDeepLink;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeepLink = () => {
    window.location.href = bitDeepLink;
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
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
          {isHe ? 'תודה על העברת התשלום!' : 'Thank you for sending the payment!'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isHe
            ? 'נוודא את התשלום בקרוב ונשלח לך אישור דוא"ל'
            : 'We\'ll verify the payment shortly and send you a confirmation email'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <QRCodeSVG
            value={qrValue}
            size={150}
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

      {/* Divider */}
      <div
        className="flex items-center gap-3"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
        <span className="text-xs">{isHe ? 'או' : 'Or'}</span>
        <div className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
      </div>

      {/* Manual Transfer */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white">
          {isHe ? 'העברה ידנית' : 'Manual Transfer'}
        </p>

        {/* Phone Number */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={phoneNumber}
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

        {/* Amount */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isHe ? 'סכום להעברה' : 'Amount to Transfer'}
          </p>
          <div
            className="px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-base font-bold text-white">₪{amount}</p>
          </div>
        </div>
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
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'rgba(0,195,216,0.3)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'rgba(0,195,216,0.2)';
        }}
      >
        <Smartphone className="w-4 h-4" />
        {isHe ? 'פתח את Bit' : 'Open Bit App'}
      </button>

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
          'אני שלחתי את התשלום'
        ) : (
          'I\'ve Sent the Payment'
        )}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        {isHe
          ? 'לאחר אישור התשלום תקבל אישור דוא"ל עם פרטי ההזמנה'
          : 'After payment confirmation, you\'ll receive an email with order details'}
      </p>
    </div>
  );
}
