import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

// Hobby plan allows max 31 days of history
const DAYS_WINDOW = 31;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId || !teamId) {
    return NextResponse.json({ visits: null, error: 'Missing VERCEL_API_TOKEN / VERCEL_PROJECT_ID / VERCEL_TEAM_ID' });
  }

  const to = new Date();
  const from = new Date(to.getTime() - DAYS_WINDOW * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url =
    `https://vercel.com/api/web-analytics/timeseries` +
    `?projectId=${projectId}&teamId=${teamId}` +
    `&from=${fmt(from)}&to=${fmt(to)}` +
    `&granularity=day&filter=%7B%7D`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // No caching — caller controls freshness via polling
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[analytics] Vercel error:', res.status, body);
      return NextResponse.json({ visits: null, error: `Vercel ${res.status}` });
    }

    const data = await res.json();
    // Response: { data: { groups: { all: [{ key, total, devices, bounceRate }] } } }
    const days: { total: number }[] = data?.data?.groups?.all ?? [];
    const totalVisits = days.reduce((s, d) => s + (d.total ?? 0), 0);

    return NextResponse.json({ visits: totalVisits, days: days.length });
  } catch (err) {
    console.error('[analytics] fetch error:', err);
    return NextResponse.json({ visits: null, error: 'Fetch failed' });
  }
}
