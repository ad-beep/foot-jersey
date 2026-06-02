'use client';

import { useCallback, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

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

export interface PayPalButtonProps {
  amount: number;
  isHe: boolean;
  shippingAddress?: ShippingAddress;
  /** Run form validation before opening PayPal. Return false to abort. */
  onValidate?: () => boolean;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

// Sentinel thrown from createOrder when the cart form is invalid. We swallow it
// in onError so the customer sees the field/toast errors, not a scary message.
const VALIDATION_ABORT = 'validation_abort';

/**
 * The official PayPal button (branded, recognizable). Renders ONLY the PayPal
 * funding source — card + paylater are disabled so the SDK never loads PayPal's
 * Advanced Card form (ACDC), which isn't available for this IL account. Cards
 * are handled separately by the dedicated card button (hosted guest checkout).
 */
export function PayPalButton({
  amount,
  isHe,
  shippingAddress,
  onValidate,
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const isCapturing = useRef(false);

  const handleCreateOrder = useCallback(async () => {
    if (onValidate && !onValidate()) {
      throw new Error(VALIDATION_ABORT);
    }
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.toFixed(2), shippingAddress }),
    });
    if (!res.ok) throw new Error('create_failed');
    return (await res.json()).orderId;
  }, [amount, shippingAddress, onValidate]);

  const handleApprove = useCallback(
    async (data: { orderID: string }) => {
      if (isCapturing.current) return;
      isCapturing.current = true;
      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        if (!res.ok) throw new Error('capture_failed');
        const d = await res.json();
        if (d.status !== 'COMPLETED') throw new Error('not_completed');
        onSuccess(d.orderId);
      } catch {
        isCapturing.current = false;
        onError(isHe ? 'התשלום נכשל, נסה שוב' : 'Payment failed, please try again');
      }
    },
    [onSuccess, onError, isHe]
  );

  const handleErr = useCallback(
    (err: Record<string, unknown>) => {
      if ((err?.message as string) === VALIDATION_ABORT) return; // expected abort
      onError(isHe ? 'התשלום נכשל, נסה שוב' : 'Payment failed, please try again');
    },
    [onError, isHe]
  );

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        currency: 'ILS',
        intent: 'capture',
        'disable-funding': 'card,paylater',
      }}
    >
      <PayPalButtons
        fundingSource="paypal"
        style={{ layout: 'vertical', color: 'blue', shape: 'rect', height: 48, tagline: false, label: 'paypal' }}
        createOrder={handleCreateOrder}
        onApprove={handleApprove}
        onError={handleErr}
      />
    </PayPalScriptProvider>
  );
}
