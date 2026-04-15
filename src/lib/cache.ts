import { CACHE_TTL } from './constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  // Run expired-entry cleanup every 5 minutes to prevent unbounded memory growth
  // on long-lived serverless warm instances.
  private sweepInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Only schedule the sweep in a Node.js context (not during SSR/edge builds)
    if (typeof setInterval !== 'undefined') {
      this.sweepInterval = setInterval(() => this.sweep(), 5 * 60 * 1000);
      // Don't keep the process alive just for cache sweeping
      if (this.sweepInterval?.unref) this.sweepInterval.unref();
    }
  }

  /** Remove all expired entries — runs automatically every 5 minutes */
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.store.delete(key);
      }
    }
  }

  get<T>(key: string, ignoreExpiry = false): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (!ignoreExpiry && Date.now() - entry.timestamp > entry.ttl * 1000) {
      // Lazy deletion — remove stale entry on access
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl = CACHE_TTL): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    // Treat expired entries as absent
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /** Expose current entry count (useful for monitoring) */
  get size(): number {
    return this.store.size;
  }
}

// Singleton instance persists across API route invocations in the same process
export const cache = new MemoryCache();
