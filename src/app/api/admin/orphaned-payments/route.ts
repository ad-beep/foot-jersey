import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const snap = await getAdminDb()
      .collection('capturedPayments')
      .where('orderCreated', '==', false)
      .get();
    const orphaned = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((p: any) => {
        if (!p.capturedAt) return true;
        const capturedAtMs = p.capturedAt.toMillis ? p.capturedAt.toMillis() : 0;
        return capturedAtMs < twoMinutesAgo.getTime();
      });
    return NextResponse.json({ orphaned });
  } catch (error) {
    console.error('Failed to fetch orphaned payments:', error);
    return NextResponse.json({ orphaned: [] });
  }
}
