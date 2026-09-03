import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { isBenignConnectionError } = require('../../lib/server/register-connection-guards.cjs');

describe('isBenignConnectionError', () => {
  it('treats ECONNRESET and aborted as benign', () => {
    expect(isBenignConnectionError({ code: 'ECONNRESET' })).toBe(true);
    expect(isBenignConnectionError({ code: 'EPIPE' })).toBe(true);
    expect(isBenignConnectionError({ message: 'aborted', code: 'ECONNRESET' })).toBe(true);
    expect(isBenignConnectionError({ name: 'AbortError' })).toBe(true);
  });

  it('does not treat real failures as benign', () => {
    expect(isBenignConnectionError(new Error('database connection failed'))).toBe(false);
    expect(isBenignConnectionError(null)).toBe(false);
  });
});
