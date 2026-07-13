/**
 * Process-level JSON file cache.
 *
 * Server-side: reads from public/data/ via fs, caches per process.
 * Client-side: returns empty object — data must be passed as props from server.
 *
 * Uses dynamic require() so webpack does not trace 'fs' into client bundles.
 */

const _cache = new Map<string, unknown>();
const _errors = new Map<string, unknown>();

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (typeof window !== 'undefined') {
    // Client — never read from fs; data must come via server props
    return {} as T;
  }
  if (_errors.has(filename)) {
    return {} as T;
  }
  if (_cache.has(filename)) return _cache.get(filename) as T;
  
  try {
    // Dynamic require keeps 'fs' out of webpack's static import graph
    const fs = require('fs') as typeof import('fs');
    const nodePath = require('path') as typeof import('path');
    const filePath = nodePath.join(process.cwd(), 'public/data', filename);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`[json-cache] File not found: ${filePath}`);
      _errors.set(filename, true);
      return {} as T;
    }
    
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as T;
    _cache.set(filename, parsed);
    return parsed;
  } catch (error) {
    console.error(`[json-cache] Error loading ${filename}:`, error);
    _errors.set(filename, error);
    return {} as T;
  }
}

export function clearJsonCache() {
  _cache.clear();
  _errors.clear();
}
