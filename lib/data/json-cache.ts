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
  if (_cache.has(filename)) return _cache.get(filename) as T;

  try {
    // Use __non_webpack_require__ to prevent webpack from bundling fs/path into client code
    const nodeRequire = getNodeRequire();
    const fs = nodeRequire('fs') as typeof import('fs');
    const nodePath = nodeRequire('path') as typeof import('path');
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
