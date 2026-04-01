import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from './admin';

/**
 * Verifies the Firebase ID token in the Authorization header.
 * Returns { ok: true, email } if valid admin, or { ok: false, response } to return early.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ ok: true; email: string } | { ok: false; response: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const idToken = authHeader.slice(7);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    console.error('[admin-auth] NEXT_PUBLIC_FIREBASE_API_KEY not set');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }),
    };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
      };
    }

    const data = await res.json();
    const email: string | undefined = data.users?.[0]?.email;

    if (!email || !isAdminEmail(email)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    return { ok: true, email };
  } catch (err) {
    console.error('[admin-auth] Token verification failed:', err);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Auth check failed' }, { status: 500 }),
    };
  }
}
