// lib/cache.ts
// Unified caching - delegates to lib/performance/cache.ts for Redis with in-memory fallback
// DEPRECATED: Use lib/performance/cache.ts directly for new code
export { getCache, setCache, deleteCache, clearCacheByPrefix } from './performance/cache';
export type { CacheOptions } from './performance/cache';
import { setCache, deleteCache, getCache, clearCacheByPrefix, type CacheOptions } from './performance/cache';

// Backward-compatible aliases for existing code
export const cacheGet = getCache;
export const cacheSet = setCache;
export const cacheDel = deleteCache;
export { clearCacheByPrefix as cacheInvalidatePattern };
