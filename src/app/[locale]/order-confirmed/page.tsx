// src/app/[locale]/order-confirmed/page.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE_NAME } from '@/lib/constants';
import { fetchJerseys } from '@/lib/google-sheets';
import { OrderConfirmedClient } from './client';
import type { Jersey } from '@/types';

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Order Confirmed | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function OrderConfirmedPage() {
  let allJerseys: Jersey[] = [];
  try {
    allJerseys = await fetchJerseys();
  } catch {
    allJerseys = [];
  }

  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #C8A24B', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <OrderConfirmedClient allJerseys={allJerseys} />
    </Suspense>
  );
}
