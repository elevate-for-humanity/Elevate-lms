const cache = new Map<string, { value: any; expires: number }>();

export async function getCached<T>(key: string): Promise<T | null> {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }

  return item.value as T;
}

export async function setCached(key: string, value: any, ttlSeconds: number = 300) {
  cache.set(key, {
    value,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

export async function deleteCached(key: string) {
  cache.delete(key);
}

export async function clearCache() {
  cache.clear();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expires) {
      cache.delete(key);
    }
  }
}, 60000);
