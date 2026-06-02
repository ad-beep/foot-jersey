'use client';

import { useState, useCallback, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { AlertCircle } from 'lucide-react';

function getPayPalOptions() {
  // CRITICAL: disable-funding must include 'card'. Without it, PayPal's SDK
  // renders a separate in-website Card button that opens the Standard Card
  // Fields (SCF) form — that form was rejecting every submission with
  // INVALID_EXP and is exactly what we're routing around.
  //
  // With card disabled here, only the PayPal button renders on our page.
  // When a customer clicks it, PayPal opens their own hosted checkout page
  // where a "Pay with Debit or Credit Card" guest option is built into the
  // page itself (separate product from SCF, always available, doesn't
  // depend on our merchant having the Advanced Cards capability).
  return {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
    currency: 'ILS' as const,
    intent: 'capture' as const,
    'disable-funding': 'card,paylater' as const,
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
  shippingAddress?: ShippingAddress;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  onValidate?: () => boolean;
}

export function PayPalPayment({
  amount,
  isHe,
  isRtl,
  shippingAddress,
  onSuccess,
  onError,
  onValidate,
}: PayPalPaymentProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');
  // Ref-based flag prevents double-capture without triggering a re-render
  // (a re-render would reinitialize PayPalScriptProvider and re-enable the button)
  const isCapturing = useRef(false);

  const handleCreateOrder = useCallback(
    async () => {
      if (onValidate && !onValidate()) {
        // Validation failed — form errors are shown by onValidate itself.
        // Throw a sentinel so PayPal aborts without showing our error UI.
        throw new Error('__validation_failed__');
      }
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
    [amount, onError, onValidate, shippingAddress]
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
      if ((err.message as string) === '__validation_failed__') return;
      const message = (err.message as string) || 'PayPal payment failed';
      setErrorMessage(message);
      onError(message);
    },
    [onError]
  );

  const paypalOptions = getPayPalOptions();

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
          fundingSource="paypal"
          style={{
            layout: 'vertical',
            color: 'blue',
            height: 48,
            tagline: false,
          }}
        />

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {isHe
            ? 'התשלום מאובטח דרך PayPal. ניתן לשלם עם חשבון PayPal או עם כרטיס אשראי כאורח.'
            : 'Secure checkout via PayPal. Pay with your PayPal account or use a credit/debit card as guest.'}
        </p>
      </div>
    </PayPalScriptProvider>
  );
}
