/**
 * Process-level JSON file cache.
 *
 * Server-side: reads from public/data/ via Node built-ins, caches per process.
 * Client-side: returns an empty object — data must be passed as props from server.
 *
 * process.getBuiltinModule() works in both CommonJS and ESM Node runtimes and
 * avoids a static fs/path import being traced into browser bundles.
 */

const _cache = new Map<string, unknown>();
const _errors = new Map<string, unknown>();

type FsModule = typeof import('fs');
type PathModule = typeof import('path');

function getNodeBuiltin<T>(name: string): T {
  const getter = (process as typeof process & {
    getBuiltinModule?: (specifier: string) => unknown;
  }).getBuiltinModule;
  if (!getter) {
    throw new Error(`Node built-in loader is unavailable for ${name}`);
  }
  const loaded = getter(name);
  if (!loaded) throw new Error(`Node built-in module ${name} is unavailable`);
  return loaded as T;
}

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (typeof window !== 'undefined') return {} as T;
  if (_errors.has(filename)) return {} as T;
  if (_cache.has(filename)) return _cache.get(filename) as T;

  try {
    const fs = getNodeBuiltin<FsModule>('fs');
    const nodePath = getNodeBuiltin<PathModule>('path');
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
