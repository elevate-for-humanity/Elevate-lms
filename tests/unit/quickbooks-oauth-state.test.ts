import { describe, expect, it } from 'vitest';
import {
  createQuickBooksOAuthState,
  verifyQuickBooksOAuthState,
} from '@/lib/integrations/quickbooks-oauth-state';

describe('QuickBooks OAuth state', () => {
  const secret = 'test-client-secret';
  const now = Date.UTC(2026, 8, 4, 8, 0, 0);

  it('accepts a fresh signed state', () => {
    const state = createQuickBooksOAuthState(secret, now);
    expect(verifyQuickBooksOAuthState(state, secret, now + 1_000)).toBe(true);
  });

  it('rejects tampering and the wrong secret', () => {
    const state = createQuickBooksOAuthState(secret, now);
    expect(verifyQuickBooksOAuthState(`${state}x`, secret, now)).toBe(false);
    expect(verifyQuickBooksOAuthState(state, 'wrong-secret', now)).toBe(false);
  });

  it('rejects expired and future states', () => {
    const state = createQuickBooksOAuthState(secret, now);
    expect(verifyQuickBooksOAuthState(state, secret, now + 10 * 60 * 1_000 + 1)).toBe(false);
    expect(verifyQuickBooksOAuthState(state, secret, now - 1)).toBe(false);
  });
});
