'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAdminEmail } from '@/lib/admin';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'loading' | 'authorized' | 'denied'>('loading');

  useEffect(() => {
    setMounted(true);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && isAdminEmail(user.email)) {
        setStatus('authorized');
      } else {
        setStatus('denied');
        router.replace('/');
      }
    });
    return () => unsub();
  }, [router]);

  // Prevent server/client mismatch — always render loading spinner on first paint
  if (!mounted || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'denied') return null;

  return <>{children}</>;
}
