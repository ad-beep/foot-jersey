'use client';

import { useState, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { AlertCircle } from 'lucide-react';

const PAYPAL_OPTIONS = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
  currency: 'ILS' as const,
  intent: 'capture' as const,
  'enable-funding': 'card',
};

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
}

export function PayPalPayment({
  amount,
  isHe,
  isRtl,
  shippingAddress,
  onSuccess,
  onError,
}: PayPalPaymentProps) {
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleCreateOrder = useCallback(
    async (data: any, actions: any) => {
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
    async (data: any, actions: any) => {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to capture PayPal order';
        setErrorMessage(message);
        onError(message);
        throw err;
      }
    },
    [onSuccess, onError]
  );

  const handleError = useCallback(
    (err: any) => {
      const message = err.message || 'PayPal payment failed';
      setErrorMessage(message);
      onError(message);
    },
    [onError]
  );

  return (
    <PayPalScriptProvider options={PAYPAL_OPTIONS}>
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
          style={{
            layout: 'vertical',
            color: 'blue',
            height: 48,
            tagline: false,
          }}
        />

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {isHe
            ? 'התשלום בעזרת PayPal מאובטח ודעות אישית שלך מוגנות'
            : 'PayPal payment is secure and your information is protected'}
        </p>
      </div>
    </PayPalScriptProvider>
  );
}
