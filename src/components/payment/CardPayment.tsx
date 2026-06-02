'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  PayPalScriptProvider,
  PayPalCardFieldsProvider,
  PayPalCardFieldsForm,
  usePayPalCardFields,
} from '@paypal/react-paypal-js';
import { AlertCircle, Loader2, Lock } from 'lucide-react';

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

export interface CardPaymentProps {
  amount: number;
  isHe: boolean;
  shippingAddress?: ShippingAddress;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

// Must live inside PayPalCardFieldsProvider to access usePayPalCardFields
function SubmitButton({
  isHe,
  submitting,
  onSubmit,
}: {
  isHe: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { cardFieldsForm } = usePayPalCardFields();

  const handleClick = async () => {
    if (!cardFieldsForm || submitting) return;
    onSubmit();
    try {
      await cardFieldsForm.submit();
    } catch {
      // errors surface via onError on PayPalCardFieldsProvider
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={submitting || !cardFieldsForm}
      className="w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
      style={{ backgroundColor: 'var(--cta)' }}
    >
      {submitting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Lock className="w-4 h-4" />
          {isHe ? 'שלם עכשיו' : 'Pay Now'}
        </>
      )}
    </button>
  );
}

const CARD_STYLE = {
  input: {
    color: 'white',
    'font-size': '14px',
    'font-family': 'inherit',
  },
  '.invalid': { color: '#FF4D6D' },
  '::placeholder': { color: 'rgba(255,255,255,0.3)' },
};

function CardFieldsContent({
  amount,
  isHe,
  shippingAddress,
  onSuccess,
  onError,
}: CardPaymentProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isCapturing = useRef(false);

  const handleCreateOrder = useCallback(async () => {
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.toFixed(2), shippingAddress }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create order');
    }
    return (await res.json()).orderId;
  }, [amount, shippingAddress]);

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
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to capture payment');
        }
        setSubmitting(false);
        onSuccess((await res.json()).orderId);
      } catch (err) {
        isCapturing.current = false;
        setSubmitting(false);
        const message = err instanceof Error ? err.message : 'Payment failed';
        setErrorMessage(message);
        onError(message);
      }
    },
    [onSuccess, onError]
  );

  const handleError = useCallback(
    (err: Record<string, unknown>) => {
      isCapturing.current = false;
      setSubmitting(false);
      const message = (err.message as string) || 'Payment failed';
      setErrorMessage(message);
      onError(message);
    },
    [onError]
  );

  return (
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

      <PayPalCardFieldsProvider
        createOrder={handleCreateOrder}
        onApprove={handleApprove}
        onError={handleError}
        style={CARD_STYLE}
      >
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
        >
          <PayPalCardFieldsForm />
        </div>
        <SubmitButton
          isHe={isHe}
          submitting={submitting}
          onSubmit={() => setSubmitting(true)}
        />
      </PayPalCardFieldsProvider>

      <p
        className="text-center text-xs flex items-center justify-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Lock className="w-3 h-3" />
        {isHe
          ? 'פרטי הכרטיס מאובטחים דרך PayPal. לא נשמרים אצלנו.'
          : 'Card details secured by PayPal — never stored on our servers.'}
      </p>
    </div>
  );
}

export function CardPayment(props: CardPaymentProps) {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/paypal/client-token')
      .then((res) => res.json())
      .then((data) => {
        if (data.clientToken) {
          setClientToken(data.clientToken);
        } else {
          setTokenError(
            props.isHe ? 'שגיאה בטעינת טופס הכרטיס' : 'Failed to load card form'
          );
        }
      })
      .catch(() =>
        setTokenError(
          props.isHe ? 'שגיאה בטעינת טופס הכרטיס' : 'Failed to load card form'
        )
      )
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--gold)' }} />
      </div>
    );
  }

  if (tokenError || !clientToken) {
    return (
      <div
        className="p-3 rounded-lg flex items-start gap-2"
        style={{ backgroundColor: 'rgba(255,77,109,0.1)' }}
      >
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF4D6D' }} />
        <p className="text-sm" style={{ color: '#FF4D6D' }}>
          {tokenError}
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        currency: 'ILS',
        intent: 'capture',
        components: 'card-fields',
        'data-client-token': clientToken,
      }}
    >
      <CardFieldsContent {...props} />
    </PayPalScriptProvider>
  );
}
