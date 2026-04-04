import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const VERCEL_API = 'https://api.vercel.com';

async function getProjectId(token: string): Promise<string | null> {
  // Vercel injects VERCEL_PROJECT_ID automatically in every deployment
  if (process.env.VERCEL_PROJECT_ID) return process.env.VERCEL_PROJECT_ID;

  // Fallback: search all projects for the slug "foot-jersey"
  try {
    const res = await fetch(`${VERCEL_API}/v9/projects?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error('[analytics] project list error:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const projects: { id: string; name: string }[] = data.projects ?? [];
    // Try to match by slug or name
    const match =
      projects.find((p) => p.name === 'foot-jersey') ??
      projects.find((p) => p.name.toLowerCase().includes('jersey'));
    if (match) return match.id;
    // Last resort: return first project if only one
    if (projects.length === 1) return projects[0].id;
    console.error('[analytics] no matching project found, projects:', projects.map((p) => p.name));
    return null;
  } catch (err) {
    console.error('[analytics] project lookup failed:', err);
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
    return NextResponse.json({ visits: null, error: 'Could not resolve project ID' });
  }

  const from = '2024-01-01';
  const to = new Date().toISOString().slice(0, 10);

  // Try the two known Vercel Analytics endpoint formats
  const endpoints = [
    `${VERCEL_API}/v1/web-analytics/stat?projectId=${projectId}&environment=production&from=${from}&to=${to}`,
    `${VERCEL_API}/v1/web-analytics/timeseries?projectId=${projectId}&environment=production&from=${from}&to=${to}&granularity=month`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
      });

      const raw = await res.text();

      if (!res.ok) {
        console.error(`[analytics] ${url} → ${res.status}:`, raw);
        continue;
      }

      console.log(`[analytics] ${url} → OK:`, raw.slice(0, 300));

      let data: unknown;
      try { data = JSON.parse(raw); } catch { continue; }

      // Handle multiple possible response shapes from Vercel
      const d = data as Record<string, unknown>;
      const pageviews =
        // Shape: { data: { pageviews, visitors } }
        (d?.data as Record<string, unknown>)?.pageviews ??
        (d?.data as Record<string, unknown>)?.visitors ??
        // Shape: { pageviews, visitors }
        d?.pageviews ??
        d?.visitors ??
        // Shape: { data: [{ key, value }] }
        (Array.isArray((d as Record<string, unknown>)?.data)
          ? ((d as Record<string, unknown>).data as { key: string; value: number }[])
              .find((x) => x.key === 'pageviews' || x.key === 'visitors')?.value
          : undefined) ??
        // Shape: array of { t, visitors }
        (Array.isArray(data)
          ? (data as { visitors?: number; pageviews?: number }[]).reduce(
              (s, x) => s + (x.pageviews ?? x.visitors ?? 0),
              0,
            )
          : undefined) ??
        null;

      if (pageviews != null) return NextResponse.json({ visits: pageviews });
    } catch (err) {
      console.error(`[analytics] fetch error for ${url}:`, err);
    }
  }

  return NextResponse.json({ visits: null, error: 'Could not parse Vercel Analytics response' });
}
