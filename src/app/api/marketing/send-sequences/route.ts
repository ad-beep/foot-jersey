import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { sendMarketingDay3Email, sendMarketingDay7Email } from '@/lib/email';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  let day3Sent = 0;
  let day7Sent = 0;
  let errors = 0;

  try {
    const snap = await getDocs(collection(db, 'exitIntentLeads'));

    await Promise.all(
      snap.docs.map(async (leadDoc) => {
        const data = leadDoc.data();
        if (data.convertedAt) return;

        const emailsSent: string[] = data.emailsSent ?? [];
        const capturedAt: number =
          data.capturedAt?.toMillis?.() ?? data.capturedAt?.seconds * 1000 ?? 0;
        if (!capturedAt) return;

        const daysSince = (now - capturedAt) / DAY_MS;
        const discountCode: string = data.discountCode ?? 'STAY10';
        const to: string = data.email;
        const ref = doc(db, 'exitIntentLeads', leadDoc.id);

        try {
          if (daysSince >= 7 && emailsSent.includes('day3') && !emailsSent.includes('day7')) {
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

    return NextResponse.json({ ok: true, day3Sent, day7Sent, errors });
  } catch (err) {
    console.error('[marketing-seq] fatal:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
