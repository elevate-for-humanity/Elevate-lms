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
const _fileMtimes = new Map<string, number>();

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (typeof window !== 'undefined') {
    // Client — never read from fs; data must come via server props
    return {} as T;
  }
  if (_errors.has(filename)) {
    return {} as T;
  }

  // Dynamic require keeps 'fs' out of webpack's static import graph
  const fs = require('fs') as typeof import('fs');
  const nodePath = require('path') as typeof import('path');

  // Prefer the image-embedded path (apps/marketing/public/data) if it exists.
  // Fall back to public/data for compatibility with other apps.
  // This ensures marketing static data is always read from the Docker image,
  // bypassing any volume mounts that may override the public/ directory.
  const marketingDataPath = nodePath.join(process.cwd(), 'apps/marketing/public/data', filename);
  const defaultDataPath = nodePath.join(process.cwd(), 'public/data', filename);

  // Use marketing path if it exists (marketing app), otherwise use default path
  const filePath = fs.existsSync(marketingDataPath) ? marketingDataPath : defaultDataPath;

  try {
    // Invalidate cache if file mtime changed (file was updated on disk)
    const mtime = fs.statSync(filePath).mtimeMs;
    const cached = _cache.get(filename) as T | undefined;
    const cachedMtime = _fileMtimes.get(filename);

    if (cached && cachedMtime === mtime) {
      return cached;
    }

    if (!fs.existsSync(filePath)) {
      console.warn(`[json-cache] File not found: ${filePath}`);
      _errors.set(filename, true);
      return {} as T;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as T;
    _cache.set(filename, parsed);
    _fileMtimes.set(filename, mtime);
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
  _fileMtimes.clear();
}
