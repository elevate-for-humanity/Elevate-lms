/**
 * Process-level JSON file cache.
 *
 * Server-side: reads from public/data/ via Node built-ins, caches per process.
 * Client-side (real browser): the fs built-in is unavailable, so this returns
 * an empty object — data must be passed as props from the server.
 *
 * Node-backed test environments such as jsdom expose `window` while still
 * providing fs. Gate on built-in availability instead of window presence so
 * those tests exercise the real JSON data path.
 *
 * process.getBuiltinModule() works in both CommonJS and ESM Node runtimes and
 * avoids a static fs/path import being traced into browser bundles.
 */

const _cache = new Map<string, unknown>();
const _errors = new Map<string, unknown>();

type FsModule = typeof import('fs');
type PathModule = typeof import('path');

function getNodeBuiltin<T>(name: string): T | null {
  const getter = (process as typeof process & {
    getBuiltinModule?: (specifier: string) => unknown;
  }).getBuiltinModule;
  if (!getter) return null;
  return (getter(name) as T) ?? null;
}

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (_errors.has(filename)) return {} as T;
  if (_cache.has(filename)) return _cache.get(filename) as T;

  const fs = getNodeBuiltin<FsModule>('fs');
  const nodePath = getNodeBuiltin<PathModule>('path');
  if (!fs || !nodePath) {
    // Real browser: no Node filesystem. Data must arrive via server props.
    return {} as T;
  }

  try {
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
