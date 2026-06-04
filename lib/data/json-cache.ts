/**
 * Process-level JSON file cache.
 *
 * Reads public/data/*.json on the Node.js server (including Client Component SSR).
 * In the browser, returns {} — callers must pass data via server props when needed.
 */

const _cache = new Map<string, unknown>();

function canReadFromDisk(): boolean {
  return typeof process !== 'undefined' && process.versions?.node != null;
}

export function loadJsonOnce<T = unknown>(filename: string): T {
  if (_cache.has(filename)) return _cache.get(filename) as T;

  if (!canReadFromDisk()) {
    return {} as T;
  }

  try {
    const { readFileSync } = require('fs') as typeof import('fs');
    const { join } = require('path') as typeof import('path');
    const raw = readFileSync(join(process.cwd(), 'public/data', filename), 'utf8');
    const parsed = JSON.parse(raw) as T;
    _cache.set(filename, parsed);
    return parsed;
  } catch {
    return {} as T;
  }
}

export function clearJsonCache() {
  _cache.clear();
}
