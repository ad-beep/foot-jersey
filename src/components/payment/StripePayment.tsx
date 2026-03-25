'use client';

import { useState, useCallback } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { AlertCircle } from 'lucide-react';

interface StripePaymentProps {
  amount: number;
  isHe: boolean;
  isRtl: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function StripePayment({
  amount,
  isHe,
  isRtl,
  onSuccess,
  onError,
  loading,
  setLoading,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!stripe || !elements) {
        setErrorMessage(
          isHe ? 'שגיאה בטעינת שירות התשלום' : 'Payment service failed to load'
        );
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout-success`,
          },
          redirect: 'if_required',
        });

        if (error) {
          setErrorMessage(error.message || 'Payment failed');
          onError(error.message || 'Payment failed');
        } else {
          // Payment succeeded
          onSuccess('payment_intent_created');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setErrorMessage(message);
        onError(message);
      } finally {
        setLoading(false);
      }
    },
    [stripe, elements, isHe, onSuccess, onError, setLoading]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <PaymentElement
          options={{
            layout: 'tabs',
            terms: {
              card: isHe ? 'never' : 'auto',
            },
          }}
        />
      </div>

      {errorMessage && (
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: 'rgba(255,77,109,0.1)' }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF4D6D' }} />
          <p className="text-sm" style={{ color: '#FF4D6D' }}>
            {errorMessage}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full py-3 rounded-xl font-bold text-base text-white transition-all duration-200 disabled:opacity-60"
        style={{ backgroundColor: 'var(--cta)' }}
        onMouseEnter={(e) => {
          if (!loading && stripe && elements)
            (e.currentTarget as HTMLElement).style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
        }}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
        ) : isHe ? (
          `שלם ${amount} ₪`
        ) : (
          `Pay ₪${amount}`
        )}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        {isHe
          ? 'התשלום מאובטח ודעות אישית שלך מוגנות'
          : 'Your payment is secure and your information is protected'}
      </p>
    </form>
  );
}
