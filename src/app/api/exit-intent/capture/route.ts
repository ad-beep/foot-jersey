import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    await addDoc(collection(db, 'exitIntentLeads'), {
      email,
      capturedAt: serverTimestamp(),
      source: 'exit_intent',
      discountCode: 'STAY10',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('exit-intent capture error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
