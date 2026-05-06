interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  isValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp <= entry.ttl;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new CacheManager();

export const CACHE_TTL = {
  PRODUCTS: 10 * 60 * 1000, // 10 minutes
  CATEGORIES: 10 * 60 * 1000,
  SETTINGS: 30 * 60 * 1000,
  INGREDIENTS: 10 * 60 * 1000,
  PAYMENT_METHODS: 10 * 60 * 1000,
};
