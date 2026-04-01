'use client';

import { usePathname } from 'next/navigation';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const isHe = pathname?.startsWith('/he');
  const homeHref = isHe ? '/he' : '/en';

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        padding: '40px 16px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginBottom: 8 }}>500</h1>
      <p style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>
        {isHe ? 'משהו השתבש. נסה שוב.' : 'Something went wrong. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          background: '#00c3d8',
          color: '#000',
          fontSize: 14,
          fontWeight: 700,
          padding: '12px 24px',
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        {isHe ? 'נסה שוב' : 'Try Again'}
      </button>
      <a
        href={homeHref}
        style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}
      >
        {isHe ? 'חזור הביתה' : 'Go Home'}
      </a>
    </div>
  );
}
