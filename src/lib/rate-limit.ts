// In-memory rate limiter for public write endpoints.
// Lives per serverless instance — not perfectly distributed, but enough to
// blunt bot bursts and spike abuse without pulling in Redis.
//
// Each call returns { ok, retryAfter }. If ok is false the caller should
// respond 429 with Retry-After: retryAfter seconds.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();
const SWEEP_INTERVAL_MS = 60_000;

if (typeof setInterval !== 'undefined') {
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart > 10 * 60_000) buckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  if (sweep?.unref) sweep.unref();
}

export function rateLimit(opts: {
  /** Caller-provided key (usually IP + endpoint). */
  key: string;
  /** Window length in ms. */
  windowMs: number;
  /** Max requests allowed in the window. */
  max: number;
}): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  let bucket = buckets.get(opts.key);
  if (!bucket || now - bucket.windowStart >= opts.windowMs) {
    bucket = { count: 0, windowStart: now };
    buckets.set(opts.key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > opts.max) {
    const retryAfter = Math.ceil((opts.windowMs - (now - bucket.windowStart)) / 1000);
    return { ok: false, retryAfter: Math.max(1, retryAfter) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Best-effort caller IP from common edge headers. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  const vercel = request.headers.get('x-vercel-forwarded-for');
  if (vercel) return vercel.split(',')[0].trim();
  return 'unknown';
}
