/**
 * Client-side instrumentation — runs in the browser before React hydrates.
 *
 * This module MUST stay synchronous and self-contained.
 * Do NOT import anything that touches DOM, network, or heavy modules here.
 * Keep it lean so it loads fast and never blocks hydration.
 *
 * What it does:
 * - Exposes TypeScript types for globalThis.Buffer, globalThis.buffer, globalThis.process
 *   (so TS doesn't scream when you reference these globals in client code)
 * - Initializes the uppercase `Buffer` global for code that references Buffer directly
 * - Initializes the lowercase `buffer` global for code that references buffer.default
 *   (e.g., jwt.verify internally calls buffer.Buffer.from(...))
 * - Initializes the `process` global (used by many npm packages as process.env.X)
 *
 * NOTE: The actual polyfill values are provided at runtime by webpack's
 * ProvidePlugin (see next.config.mjs webpack block). This module merely
 * ensures the globals exist in TypeScript's type system so code compiles
 * without `declare` statements in every file.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Buffer: BufferPolyfill } = require('buffer');

/** Uppercase Buffer — used by jsrsasign, jsonwebtoken, etc. */
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = BufferPolyfill;
}

/** Lowerercase buffer — used by some crypto libraries internally */
if (typeof globalThis.buffer === 'undefined') {
  // buffer.default.Buffer is the same class — expose it as the default export
  (globalThis as Record<string, unknown>).buffer = BufferPolyfill;
}

/** process — used by many packages as process.env.X */
if (typeof globalThis.process === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (globalThis as Record<string, unknown>).process = require('process');
}
