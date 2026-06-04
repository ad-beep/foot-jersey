import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit({ key: `newsletter:${ip}`, windowMs: 60_000, max: 10 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } },
      );
    }

    const { email, locale } = await request.json();
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getAdminDb();
    const existing = await db
      .collection('newsletterEmails')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (existing.empty) {
      await db.collection('newsletterEmails').add({
        email: normalizedEmail,
        locale: locale === 'he' ? 'he' : 'en',
        subscribedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[newsletter] subscribe error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
