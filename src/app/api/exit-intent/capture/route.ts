import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendMarketingWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const docRef = await addDoc(collection(db, 'exitIntentLeads'), {
      email,
      capturedAt: serverTimestamp(),
      source: 'exit_intent',
      discountCode: 'STAY10',
      emailsSent: [],
    });
    sendMarketingWelcomeEmail({ to: email, discountCode: 'STAY10' })
      .then(() => updateDoc(docRef, { emailsSent: ['welcome'] }))
      .catch((err) => console.error('[exit-intent] welcome email failed:', err));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('exit-intent capture error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
