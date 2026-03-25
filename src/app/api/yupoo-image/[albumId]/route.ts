import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for resolved image URLs (persists across requests in dev server)
const imageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day (shorter to pick up fixes faster)

// Track failed albums to avoid re-fetching
const failedAlbums = new Map<string, number>();
const FAIL_COOLDOWN = 60 * 60 * 1000; // 1 hour before retrying failed albums

async function resolveYupooImage(albumId: string): Promise<string | null> {
  // Check cache first
  const cached = imageCache.get(albumId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  // Check if this album recently failed — skip to avoid hammering Yupoo
  const failTime = failedAlbums.get(albumId);
  if (failTime && Date.now() - failTime < FAIL_COOLDOWN) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const albumUrl = `https://zherming029.x.yupoo.com/albums/${albumId}?uid=1`;
    const response = await fetch(albumUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      failedAlbums.set(albumId, Date.now());
      return null;
    }

    const html = await response.text();

    // Extract ALL image URLs from the album page
    // big > medium > small priority
    const bigMatches = html.matchAll(
      /data-src="(https:\/\/photo\.yupoo\.com\/zherming029\/([a-f0-9]+)\/big\.jpg)"/g
    );
    const medMatches = html.matchAll(
      /src="(https:\/\/photo\.yupoo\.com\/zherming029\/([a-f0-9]+)\/medium\.jpg)"/g
    );
    const smallMatches = html.matchAll(
      /src="(https:\/\/photo\.yupoo\.com\/zherming029\/([a-f0-9]+)\/small\.jpg)"/g
    );

    // Collect unique images by hash, prefer big > medium > small
    const hashToUrl = new Map<string, string>();
    const orderedHashes: string[] = [];

    for (const m of smallMatches) {
      if (!hashToUrl.has(m[2])) orderedHashes.push(m[2]);
      hashToUrl.set(m[2], m[1]);
    }
    for (const m of medMatches) {
      if (!hashToUrl.has(m[2])) orderedHashes.push(m[2]);
      hashToUrl.set(m[2], m[1]);
    }
    for (const m of bigMatches) {
      if (!hashToUrl.has(m[2])) orderedHashes.push(m[2]);
      hashToUrl.set(m[2], m[1]);
    }

    // De-duplicate the ordered list
    const seen = new Set<string>();
    const uniqueHashes = orderedHashes.filter((h) => {
      if (seen.has(h)) return false;
      seen.add(h);
      return true;
    });

    // Pick the FRONT-VIEW image:
    // Yupoo sellers have varying album orders. Strategy:
    // - If 3+ images: pick the 1st image (often the main front shot)
    //   because many albums go: front, back, detail, patch
    // - If exactly 2: pick the 1st image
    // - If 1: use it
    let imageUrl: string | null = null;
    if (uniqueHashes.length >= 1) {
      imageUrl = hashToUrl.get(uniqueHashes[0]) || null;
    }

    // Fallback: try the legacy single-match approach
    if (!imageUrl) {
      const legacyBig = html.match(
        /data-src="(https:\/\/photo\.yupoo\.com\/zherming029\/[a-f0-9]+\/big\.jpg)"/
      );
      const legacyMed = html.match(
        /src="(https:\/\/photo\.yupoo\.com\/zherming029\/[a-f0-9]+\/medium\.jpg)"/
      );
      const legacySmall = html.match(
        /src="(https:\/\/photo\.yupoo\.com\/zherming029\/[a-f0-9]+\/small\.jpg)"/
      );
      imageUrl = legacyBig?.[1] || legacyMed?.[1] || legacySmall?.[1] || null;
    }

    if (imageUrl) {
      imageCache.set(albumId, { url: imageUrl, timestamp: Date.now() });
      return imageUrl;
    }

    failedAlbums.set(albumId, Date.now());
    return null;
  } catch (error) {
    failedAlbums.set(albumId, Date.now());
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    console.error(`Failed to resolve Yupoo image for album ${albumId}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const { albumId } = params;

  if (!albumId || !/^\d+$/.test(albumId)) {
    return NextResponse.json({ error: 'Invalid album ID' }, { status: 400 });
  }

  const imageUrl = await resolveYupooImage(albumId);

  if (!imageUrl) {
    // Return a small placeholder SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f3f4f6"/>
      <text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" fill="#9ca3af">Image unavailable</text>
    </svg>`;
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Redirect to the actual image URL with long cache
  return NextResponse.redirect(imageUrl, {
    headers: {
      'Cache-Control': 'public, max-age=604800, s-maxage=604800',
    },
  });
}
