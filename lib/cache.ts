// In-memory high performance server-side cache for fast page and navigation loading

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

// Global cache store attached to global object so it survives HMR in dev
const globalForCache = global as unknown as {
  safServerCache?: Map<string, CacheEntry<any>>;
};

const cacheStore = globalForCache.safServerCache || new Map<string, CacheEntry<any>>();
if (process.env.NODE_ENV !== 'production') {
  globalForCache.safServerCache = cacheStore;
}

export function getFromCache<T>(key: string, ttlMs: number = 60000): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setToCache<T>(key: string, data: T): void {
  cacheStore.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(patternOrPrefix?: string): void {
  if (!patternOrPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(patternOrPrefix)) {
      cacheStore.delete(key);
    }
  }
}
