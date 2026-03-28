// src/app/[locale]/order-confirmed/page.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE_NAME } from '@/lib/constants';
import { OrderConfirmedClient } from './client';

export const metadata: Metadata = {
  title: `Order Confirmed | ${SITE_NAME}`,
};

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #00c3d8', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <OrderConfirmedClient />
    </Suspense>
  );
}
