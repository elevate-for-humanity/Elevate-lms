/**
 * Suppress benign client-disconnect errors (ECONNRESET / "aborted") in production logs.
 * Loaded from instrumentation (ESM) and apps/admin/server.js (CJS).
 */
'use strict';

let registered = false;

function isBenignConnectionError(err) {
  if (!err || typeof err !== 'object') return false;

  const code = typeof err.code === 'string' ? err.code : undefined;
  const message = typeof err.message === 'string' ? err.message : '';
  const name = typeof err.name === 'string' ? err.name : '';

  if (code === 'ECONNRESET' || code === 'EPIPE' || code === 'ERR_STREAM_PREMATURE_CLOSE') {
    return true;
  }
  if (name === 'AbortError') return true;
  if (message === 'aborted' || message.toLowerCase().includes('aborted')) return true;

  return false;
}

function registerConnectionGuards() {
  if (registered) return;
  registered = true;

  const originalEmit = process.emit.bind(process);
  process.emit = function patchedEmit(event, ...args) {
    if (event === 'uncaughtException' && isBenignConnectionError(args[0])) {
      return false;
    }
    if (event === 'unhandledRejection' && isBenignConnectionError(args[0])) {
      return false;
    }
    return originalEmit(event, ...args);
  };
}

module.exports = { isBenignConnectionError, registerConnectionGuards };
