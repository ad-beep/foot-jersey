import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

// Returns whether the email-system env vars are configured. The actual lead
// and cart data is read client-side via Firestore rules (admin-only), so this
// endpoint stays tiny and never touches the database.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    gmailUser: !!process.env.GMAIL_USER,
    gmailPass: !!process.env.GMAIL_APP_PASSWORD,
    cronSecret: !!process.env.CRON_SECRET,
  });
}
