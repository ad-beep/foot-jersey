import { NextRequest, NextResponse } from 'next/server';
import { fetchJerseys, fetchJerseysByLeague, invalidateJerseysCache } from '@/lib/google-sheets';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league');
    const id = searchParams.get('id');
    const refresh = searchParams.get('refresh');

    // Force cache refresh — admin only
    if (refresh === 'true') {
      const auth = await requireAdmin(request);
      if (!auth.ok) return auth.response;
      invalidateJerseysCache();
    }

    let data;

    if (id) {
      const jerseys = await fetchJerseys();
      const jersey = jerseys.find((j) => j.id === id);
      if (!jersey) {
        return NextResponse.json(
          { error: 'Jersey not found', data: null },
          { status: 404 }
        );
      }
      data = jersey;
    } else if (league) {
      data = await fetchJerseysByLeague(league);
    } else {
      data = await fetchJerseys();
    }

    return NextResponse.json(
      { data, error: null, timestamp: Date.now() },
      {
        headers: {
          // Vercel edge cache for 5 min, serve stale up to 1h while revalidating.
          // Under a traffic spike this keeps Google Sheets at ~1 read / 5 min /
          // edge region, not once per visitor.
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('API /products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', data: [] },
      { status: 500 }
    );
  }
}
