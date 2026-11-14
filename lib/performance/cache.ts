// Redis-based caching with fallback to in-memory
import { Redis } from 'ioredis';
let redis: Redis | null = null;
const memoryCache = new Map<string, { value: any; expires: number }>();
// Initialize Redis if configured
export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }
  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL);
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return null;
    }
  }
  return redis;
}
// Cache interface
export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  prefix?: string;
}
// Get from cache
export async function getCache<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
  const client = getRedisClient();
  if (client) {
    try {
      const value = await client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }
  // Fallback to memory cache
  const cached = memoryCache.get(fullKey);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  return null;
}
// Set cache
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {},
): Promise<void> {
  const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
  const ttl = options.ttl || 300; // Default 5 minutes
  const client = getRedisClient();
  if (client) {
    try {
      await client.setex(fullKey, ttl, JSON.stringify(value));
      return;
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }
  // Fallback to memory cache
  memoryCache.set(fullKey, {
    value,
    expires: Date.now() + ttl * 1000,
  });
}
// Delete from cache
export async function deleteCache(key: string, options: CacheOptions = {}): Promise<void> {
  const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
  const client = getRedisClient();
  if (client) {
    try {
      await client.del(fullKey);
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }
  memoryCache.delete(fullKey);
}
// Clear all cache with prefix
export async function clearCacheByPrefix(prefix: string): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      const keys = await client.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }
  // Clear memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`${prefix}:`)) {
      memoryCache.delete(key);
    }
  }
}
// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions & {
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {},
): T {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`;
    const cached = await getCache(key, options);
    if (cached !== null) {
      return cached;
    }
    const result = await fn(...args);
    await setCache(key, result, options);
    return result;
  }) as T;
}
// Cleanup expired memory cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expires < now) {
      memoryCache.delete(key);
    }
  }
}, 60000); // Every minute
