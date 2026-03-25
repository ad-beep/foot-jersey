import { CACHE_TTL } from './constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, ignoreExpiry = false): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (!ignoreExpiry && Date.now() - entry.timestamp > entry.ttl * 1000) {
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
    return this.store.has(key);
  }
}

// Singleton instance persists across API route invocations in the same process
export const cache = new MemoryCache();
