'use client';

import { ReactNode } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PayPalProviderProps {
  children: ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test';

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: 'ILS',
        intent: 'capture',
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
