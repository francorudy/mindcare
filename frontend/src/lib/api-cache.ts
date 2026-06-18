const cache = new Map<string, { data: unknown; expires: number }>();
const inflight = new Map<string, Promise<unknown>>();
const DEFAULT_TTL_MS = 30_000;

export function peekCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.data as T;
  }
  return null;
}

export function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return Promise.resolve(hit.data as T);
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, expires: Date.now() + ttlMs });
      inflight.delete(key);
      return data;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    inflight.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}
