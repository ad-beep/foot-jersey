'use client';

import { useState, useCallback, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { AlertCircle } from 'lucide-react';

function getPayPalOptions(fundingSource: 'paypal' | 'card') {
  return {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
    currency: 'ILS' as const,
    intent: 'capture' as const,
    ...(fundingSource === 'card'
      ? { 'enable-funding': 'card', 'disable-funding': 'paylater' }
      : { 'disable-funding': 'card,paylater' }),
  };
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

interface PayPalPaymentProps {
  amount: number;
  isHe: boolean;
  isRtl: boolean;
  fundingSource?: 'paypal' | 'card';
  shippingAddress?: ShippingAddress;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

export function PayPalPayment({
  amount,
  isHe,
  isRtl,
  fundingSource = 'paypal',
  shippingAddress,
  onSuccess,
  onError,
}: PayPalPaymentProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');
  // Ref-based flag prevents double-capture without triggering a re-render
  // (a re-render would reinitialize PayPalScriptProvider and re-enable the button)
  const isCapturing = useRef(false);

  const handleCreateOrder = useCallback(
    async () => {
      try {
        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount.toFixed(2),
            returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout-success`,
            cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
            shippingAddress,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create PayPal order');
        }

        const order = await response.json();
        return order.orderId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create PayPal order';
        setErrorMessage(message);
        onError(message);
        throw err;
      }
    },
    [amount, onError, shippingAddress]
  );

  const handleApprove = useCallback(
    async (data: { orderID: string }) => {
      // Guard: if a capture is already in flight, ignore this call entirely.
      // Using a ref (not state) so this check is synchronous and doesn't
      // cause a re-render that would reinitialize the PayPal SDK.
      if (isCapturing.current) return;
      isCapturing.current = true;

      try {
        const response = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId: data.orderID }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to capture PayPal order');
        }

        const order = await response.json();
        onSuccess(order.orderId);
        // Do NOT reset isCapturing — once captured, this component is done.
      } catch (err) {
        // Reset flag on failure so the user can retry.
        isCapturing.current = false;
        const message = err instanceof Error ? err.message : 'Failed to capture PayPal order';
        setErrorMessage(message);
        onError(message);
        throw err;
      }
    },
    [onSuccess, onError]
  );

  const handleError = useCallback(
    (err: Record<string, unknown>) => {
      const message = (err.message as string) || 'PayPal payment failed';
      setErrorMessage(message);
      onError(message);
    },
    [onError]
  );

  const isCard = fundingSource === 'card';
  const paypalOptions = getPayPalOptions(fundingSource);

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="space-y-4">
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

        <PayPalButtons
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onError={handleError}
          fundingSource={isCard ? 'card' : undefined}
          style={{
            layout: 'vertical',
            color: isCard ? 'black' : 'blue',
            height: 48,
            tagline: false,
          }}
        />

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {isCard
            ? (isHe
              ? 'תשלום בכרטיס אשראי מאובטח ומעובד דרך PayPal'
              : 'Credit card payment is secure and processed via PayPal')
            : (isHe
              ? 'התשלום בעזרת PayPal מאובטח ודעות אישית שלך מוגנות'
              : 'PayPal payment is secure and your information is protected')}
        </p>
      </div>
    </PayPalScriptProvider>
  );
}
