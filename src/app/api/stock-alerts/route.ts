import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email, jerseyId, size } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!jerseyId || typeof jerseyId !== 'string') {
      return NextResponse.json({ error: 'Missing jerseyId' }, { status: 400 });
    }
    if (!size || typeof size !== 'string') {
      return NextResponse.json({ error: 'Missing size' }, { status: 400 });
    }

    const alertsRef = collection(db, 'stockAlerts');
    const existing = await getDocs(
      query(alertsRef, where('email', '==', email), where('jerseyId', '==', jerseyId), where('size', '==', size), limit(1))
    );

    if (!existing.empty) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await addDoc(alertsRef, {
      email,
      jerseyId,
      size,
      createdAt: serverTimestamp(),
      notified: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[stock-alerts] capture error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
