import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const VERCEL_API = 'https://api.vercel.com';

// Resolves the Vercel project ID from env or by looking up the project by slug
async function getProjectId(token: string): Promise<string | null> {
  // Vercel auto-injects this in production deployments
  if (process.env.VERCEL_PROJECT_ID) return process.env.VERCEL_PROJECT_ID;

  // Fallback: look it up by slug
  try {
    const res = await fetch(`${VERCEL_API}/v9/projects/foot-jersey`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return NextResponse.json({ visits: null, error: 'VERCEL_API_TOKEN not set' });
  }

  const projectId = await getProjectId(token);
  if (!projectId) {
    return NextResponse.json({ visits: null, error: 'Could not resolve Vercel project ID' });
  }

  try {
    // Fetch all-time total page views
    const from = '2024-01-01';
    const to = new Date().toISOString().slice(0, 10);

    const url = `${VERCEL_API}/v1/web-analytics/stat?projectId=${projectId}&environment=production&from=${from}&to=${to}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Vercel Analytics API error:', res.status, body);
      return NextResponse.json({ visits: null, error: `Vercel API ${res.status}` });
    }

    const data = await res.json();
    // Vercel returns { data: { visitors, pageviews, ... } } or { visitors, pageviews }
    const pageviews =
      data?.data?.pageviews ??
      data?.data?.visitors ??
      data?.pageviews ??
      data?.visitors ??
      null;

    return NextResponse.json({ visits: pageviews });
  } catch (err) {
    console.error('Analytics fetch failed:', err);
    return NextResponse.json({ visits: null, error: 'Fetch failed' });
  }
}
