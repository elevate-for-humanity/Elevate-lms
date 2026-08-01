/**
 * Client-side polyfills — imported at the top of layout.tsx.
 *
 * This module patches the browser environment so that code using
 * Node.js globals (Buffer, process, etc.) works without bundling
 * the full Node.js polyfills into every chunk.
 *
 * Why not just use webpack's ProvidePlugin?
 * - ProvidePlugin injects globals at bundle-time but some code paths
 *   (dynamic imports, eval, worker threads) can escape bundling.
 * - This module runs at module-initialization time, ensuring globals
 *   are always available regardless of how a module is loaded.
 *
 * Load order:
 *   1. This file — synchronous, runs before any other module in the bundle
 *   2. Next.js internals — safe because globals are now available
 *   3. Application code — safe to use Buffer, process.env, etc.
 */

// Ensure globalThis has the globals webpack's ProvidePlugin injects.
// In some edge cases (stale SW cache, CDN edge nodes, certain bundler configs)
// the ProvidePlugin globals may not be available when this module runs.
// We set them defensively so the app never crashes.
import type { Buffer as BufferType } from 'buffer';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Buffer: BufferPolyfill } = require('buffer');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const processPolyfill = require('process');

// --- Buffer (uppercase) ---
if (typeof (globalThis as unknown as Record<string, unknown>).Buffer === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).Buffer = BufferPolyfill as unknown as typeof BufferType;
}

// --- buffer (lowercase) ---
// Some packages (e.g., some jsonwebtoken forks, certain crypto utils) reference `buffer`
// as a global that has a `.Buffer` property (similar to Node's `require('buffer')`).
if (typeof (globalThis as unknown as Record<string, unknown>).buffer === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).buffer = {
    Buffer: BufferPolyfill,
  };
}

// --- process ---
if (typeof (globalThis as unknown as Record<string, unknown>).process === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).process = processPolyfill;
}
