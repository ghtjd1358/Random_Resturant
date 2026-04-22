import "server-only";

/**
 * Thin wrapper around Vercel Runtime Cache API. Falls back to no-op in dev
 * where the runtime cache binding isn't available, so local development still
 * works without a Vercel deployment.
 *
 * https://vercel.com/docs/runtime-cache
 */
type CacheStore = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, opts?: { ttl?: number; tags?: string[] }): Promise<void>;
};

let cached: CacheStore | null = null;

async function loadCache(): Promise<CacheStore> {
  if (cached) return cached;
  try {
    const mod = await import("@vercel/functions");
    const runtimeCache = (mod as unknown as { getCache?: () => CacheStore })
      .getCache?.();
    if (runtimeCache) {
      cached = runtimeCache;
      return runtimeCache;
    }
  } catch {
    // Package not available or running outside Vercel runtime
  }
  cached = {
    async get() {
      return null;
    },
    async set() {
      /* no-op */
    },
  };
  return cached;
}

export async function withCache<T>(
  key: string,
  ttl: number,
  compute: () => Promise<T>,
  opts?: { tags?: string[] },
): Promise<T> {
  const store = await loadCache();
  const hit = await store.get<T>(key);
  if (hit != null) return hit;
  const fresh = await compute();
  await store.set(key, fresh, { ttl, tags: opts?.tags });
  return fresh;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const store = await loadCache();
  return store.get<T>(key);
}

export async function cacheSet<T>(
  key: string,
  value: T,
  opts?: { ttl?: number; tags?: string[] },
): Promise<void> {
  const store = await loadCache();
  await store.set(key, value, opts);
}
