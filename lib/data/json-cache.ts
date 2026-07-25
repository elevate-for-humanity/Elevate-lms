/**
 * Process-level JSON file cache.
 *
 * Server-side: reads from public/data/ via fs, caches per process.
 * Client-side: returns empty object — data must be passed as props from server.
 *
 * Uses __non_webpack_require__ pattern so webpack does NOT trace 'fs' into client bundles.
 * This is critical — heroBanners.ts imports this module and would break webpack if fs were bundled.
 */

const _cache = new Map<string, unknown>();
const _errors = new Map<string, unknown>();
const _fileMtimes = new Map<string, number>();

type NodeRequire = (id: string) => unknown;

function getNodeRequire(): NodeRequire {
  // __non_webpack_require__ is injected by webpack when using getNodeRequire() trick.
  // Falls back to eval('require') which webpack also ignores.
  const globalRequire = (globalThis as { __non_webpack_require__?: NodeRequire }).__non_webpack_require__;
  return typeof globalRequire === 'function'
    ? globalRequire
    : ((0, eval)('require') as NodeRequire);
}

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (typeof window !== 'undefined') {
    // Client — never read from fs; data must come via server props
    return {} as T;
  }
  if (_errors.has(filename)) {
    return {} as T;
  }

  // Use __non_webpack_require__ to prevent webpack from bundling fs/path into client code
  const nodeRequire = getNodeRequire();
  const fs = nodeRequire('fs') as typeof import('fs');
  const nodePath = nodeRequire('path') as typeof import('path');

  // Prefer the image-embedded path (apps/marketing/public/data) if it exists.
  // Fall back to public/data for compatibility with other apps.
  // This ensures marketing static data is always read from the Docker image,
  // bypassing any volume mounts that may override the public/ directory.
  const marketingDataPath = nodePath.join(process.cwd(), 'apps/marketing/public/data', filename);
  const defaultDataPath = nodePath.join(process.cwd(), 'public/data', filename);

  // Use marketing path if it exists (marketing app), otherwise use default path
  const filePath = fs.existsSync(marketingDataPath) ? marketingDataPath : defaultDataPath;

  try {
    // Check cache first (fast path for repeated requests)
    const cached = _cache.get(filename) as T | undefined;
    const cachedMtime = _fileMtimes.get(filename);

    // Invalidate cache if file mtime changed (handles volume mount or live updates)
    const mtime = fs.statSync(filePath).mtimeMs;

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
