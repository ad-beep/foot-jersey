import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { sendMarketingDay3Email, sendMarketingDay7Email, sendMarketingBlastEmail, sendMarketingWelcomeEmail } from '@/lib/email';

// How many days must pass before we send another blast to the same person
const BLAST_INTERVAL_DAYS = 5;
// Max blast emails per daily cron run (stays within free-plan Gmail limits)
const BLAST_LIMIT = 50;

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const dayIndex = Math.floor(now / DAY_MS); // monotonically increasing integer per day

  let welcomeSent = 0;
  let day3Sent = 0;
  let day7Sent = 0;
  let blastSent = 0;
  let errors = 0;

  const snap = await getDocs(collection(db, 'exitIntentLeads'));

  // ── Welcome sequences ─────────────────────────────────────────────────
  // Welcome catch-up runs first: if a lead was captured but the welcome email
  // never sent (Gmail throttle during a traffic spike, cold-start kill, etc.)
  // this cron sends it on the next run. Bounded per cron run so we don't try
  // to send 1000s of welcomes if the popup just went viral.
  const WELCOME_CATCHUP_LIMIT = 30;
  let welcomeAttempts = 0;

  await Promise.all(
    snap.docs.map(async (leadDoc) => {
      const data = leadDoc.data();

      // Skip unsubscribed and converted leads
      if (data.unsubscribedAt || data.convertedAt) return;

      const emailsSent: string[] = data.emailsSent ?? [];
      const capturedAt: number =
        data.capturedAt?.toMillis?.() ?? (data.capturedAt?.seconds ?? 0) * 1000;
      if (!capturedAt) return;

      const daysSince = (now - capturedAt) / DAY_MS;
      const discountCode: string = data.discountCode ?? 'STAY10';
      const to: string = data.email;
      const ref = doc(db, 'exitIntentLeads', leadDoc.id);

      try {
        if (!emailsSent.includes('welcome') && welcomeAttempts < WELCOME_CATCHUP_LIMIT) {
          welcomeAttempts++;
          await sendMarketingWelcomeEmail({ to, discountCode });
          await updateDoc(ref, { emailsSent: [...emailsSent, 'welcome'] });
          welcomeSent++;
        } else if (daysSince >= 7 && emailsSent.includes('day3') && !emailsSent.includes('day7')) {
          await sendMarketingDay7Email({ to, discountCode });
          await updateDoc(ref, { emailsSent: [...emailsSent, 'day7'] });
          day7Sent++;
        } else if (daysSince >= 3 && emailsSent.includes('welcome') && !emailsSent.includes('day3')) {
          await sendMarketingDay3Email({ to, discountCode });
          await updateDoc(ref, { emailsSent: [...emailsSent, 'day3'] });
          day3Sent++;
        }
      } catch (err) {
        console.error(`[marketing-seq] failed for ${to}:`, err);
        errors++;
      }
    }),
  );

  // ── Daily blast — 50 per day, rotating through all active subscribers ────────
  const blastCutoff = now - BLAST_INTERVAL_DAYS * DAY_MS;

  // Collect eligible leads: not unsubscribed, not converted, not blasted recently
  const eligible = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Record<string, any>))
    .filter((d) => {
      if (d.unsubscribedAt || d.convertedAt) return false;
      if (!d.email) return false;
      const lastBlast: number = d.lastBlastAt
        ? (d.lastBlastAt.toMillis?.() ?? (d.lastBlastAt.seconds ?? 0) * 1000)
        : 0;
      return lastBlast < blastCutoff;
    })
    // Sort: never-blasted (lastBlastAt = 0) first, then oldest blast first
    .sort((a, b) => {
      const aT = a.lastBlastAt ? (a.lastBlastAt.toMillis?.() ?? (a.lastBlastAt.seconds ?? 0) * 1000) : 0;
      const bT = b.lastBlastAt ? (b.lastBlastAt.toMillis?.() ?? (b.lastBlastAt.seconds ?? 0) * 1000) : 0;
      return aT - bT;
    })
    .slice(0, BLAST_LIMIT);

  for (const lead of eligible) {
    try {
      await sendMarketingBlastEmail({ to: lead.email, dayIndex });
      await updateDoc(doc(db, 'exitIntentLeads', lead.id), {
        lastBlastAt: Timestamp.now(),
      });
      blastSent++;
    } catch (err) {
      console.error(`[marketing-blast] failed for ${lead.email}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, welcomeSent, day3Sent, day7Sent, blastSent, errors });
}
