'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeProviderProps {
  amount: number;
  children: ReactNode;
}

export function StripeProvider({ amount, children }: StripeProviderProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (amount <= 0) return;

    let cancelled = false;

    async function createIntent() {
      try {
        const res = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to initialize payment');
        }

        const data = await res.json();
        if (!cancelled) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Payment initialization failed');
        }
      }
    }

    createIntent();
    return () => { cancelled = true; };
  }, [amount]);

  if (error) {
    return (
      <div
        className="p-4 rounded-xl text-center text-sm"
        style={{ backgroundColor: 'rgba(255,77,109,0.1)', color: '#FF4D6D' }}
      >
        {error}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(0,195,216,0.2)', borderTopColor: '#00C3D8' }}
        />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#00C3D8',
            colorBackground: '#1a1a2e',
            colorText: '#ffffff',
            colorDanger: '#FF4D6D',
            fontFamily: 'inherit',
            borderRadius: '12px',
            colorTextPlaceholder: 'rgba(255,255,255,0.35)',
          },
          rules: {
            '.Input': {
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            '.Input:focus': {
              borderColor: '#00C3D8',
              boxShadow: '0 0 0 1px #00C3D8',
            },
            '.Label': {
              color: 'rgba(255,255,255,0.7)',
            },
            '.Tab': {
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            '.Tab--selected': {
              backgroundColor: 'rgba(0,195,216,0.15)',
              borderColor: '#00C3D8',
            },
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}
