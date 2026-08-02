interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// In-memory TTL cache. Deliberately simple: fine for a single backend instance, and the
// short TTLs used against it mean brief staleness is an acceptable trade-off for cutting
// repeated aggregation queries. If this scales to multiple instances, swap the Map for
// Redis without touching call sites — the get-or-set shape stays the same.
export async function getOrSetCache<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await load();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(key: string): void {
  store.delete(key);
}

export function clearCache(): void {
  store.clear();
}
