// lib/cache.ts
// Redis caching utilities for performance optimization
import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!client) {
    try {
      client = createClient({ url: process.env.REDIS_URL });
      // Error: $1
      await client.connect();
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return null;
    }
  }
  return client;
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const c = await getClient();
  if (!c) return null;

  try {
    const value = await c.get(key);
    if (!value) return null;
    return JSON.parse(value as string) as T;
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  const c = await getClient();
  if (!c) return;

  try {
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

export async function cacheDel(key: string): Promise<void> {
  const c = await getClient();
  if (!c) return;

  try {
    await c.del(key);
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const c = await getClient();
  if (!c) return;

  try {
    // Use SCAN instead of KEYS to avoid blocking Redis
    // SCAN is cursor-based and doesn't block the server
    let cursor = 0;
    const keysToDelete: string[] = [];

    do {
      const result = await c.scan(cursor as any, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = Number(result.cursor);
      keysToDelete.push(...(result.keys as string[]));
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      // Delete in batches to avoid blocking
      const batchSize = 100;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        await c.del(batch);
      }
    }
  } catch (error) {
    /* Error handled silently */
    // Error: $1
  }
}
