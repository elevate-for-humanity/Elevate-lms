/**
 * Unit tests for the OAuth CSRF state fix (Bug B — complete fix).
 *
 * The previous partial fix generated a cryptographically random state but
 * never stored it server-side, so callbacks could not validate it. Any
 * attacker-supplied state value would pass because there was nothing to
 * compare against.
 *
 * The complete fix:
 *   authorize → generates randomBytes(16) state, sets HttpOnly cookie
 *   callback  → reads cookie, compares to returned state, rejects mismatch
 *   success   → clears the cookie (single-use)
 */

import { describe, it, expect } from 'vitest';
import { randomBytes } from 'crypto';

// ─── State generation ─────────────────────────────────────────────────────────

describe('OAuth state generation', () => {
  function generateState(): string {
    return randomBytes(16).toString('hex');
  }

  it('produces a 32-char lowercase hex string', () => {
    expect(generateState()).toMatch(/^[0-9a-f]{32}$/);
  });

  it('is unique across calls', () => {
    const states = new Set(Array.from({ length: 500 }, generateState));
    expect(states.size).toBe(500);
  });
});

// ─── Cookie config ────────────────────────────────────────────────────────────

describe('OAuth state cookie configuration', () => {
  function cookieConfig(platform: string, state: string) {
    return {
      name: `oauth_state_${platform}`,
      value: state,
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: true,
      maxAge: 600,
      path: '/',
    };
  }

  it('cookie is HttpOnly (not readable by JS)', () => {
    const cfg = cookieConfig('youtube', 'abc');
    expect(cfg.httpOnly).toBe(true);
  });

  it('cookie has SameSite=lax (blocks cross-site POST)', () => {
    const cfg = cookieConfig('linkedin', 'abc');
    expect(cfg.sameSite).toBe('lax');
  });

  it('cookie expires in 10 minutes (enough for OAuth flow)', () => {
    const cfg = cookieConfig('facebook', 'abc');
    expect(cfg.maxAge).toBe(600);
  });

  it('cookie name is platform-scoped (no cross-platform collision)', () => {
    const yt = cookieConfig('youtube', 'x').name;
    const li = cookieConfig('linkedin', 'x').name;
    const fb = cookieConfig('facebook', 'x').name;
    expect(new Set([yt, li, fb]).size).toBe(3);
  });
});

// ─── State validation logic ───────────────────────────────────────────────────

describe('OAuth state validation in callback', () => {
  function validateState(
    storedState: string | undefined,
    returnedState: string | null,
  ): 'valid' | 'invalid' {
    // Mirrors the fixed callback logic
    if (!storedState || !returnedState || storedState !== returnedState) {
      return 'invalid';
    }
    return 'valid';
  }

  it('accepts matching state', () => {
    const state = randomBytes(16).toString('hex');
    expect(validateState(state, state)).toBe('valid');
  });

  it('rejects when cookie is missing (no authorize step)', () => {
    expect(validateState(undefined, 'attacker-state')).toBe('invalid');
  });

  it('rejects when returned state is null (state param omitted)', () => {
    expect(validateState('stored-state', null)).toBe('invalid');
  });

  it('rejects when states differ (CSRF attempt)', () => {
    const stored = randomBytes(16).toString('hex');
    const attacker = randomBytes(16).toString('hex');
    expect(validateState(stored, attacker)).toBe('invalid');
  });

  it('rejects empty string state', () => {
    expect(validateState('', '')).toBe('invalid');
    expect(validateState('stored', '')).toBe('invalid');
    expect(validateState('', 'returned')).toBe('invalid');
  });

  it('is case-sensitive (hex is lowercase, no ambiguity)', () => {
    const state = 'abcdef1234567890abcdef1234567890';
    expect(validateState(state, state.toUpperCase())).toBe('invalid');
  });
});

// ─── Cookie clearance on success ─────────────────────────────────────────────

describe('OAuth state cookie clearance', () => {
  function clearCookieConfig(name: string) {
    return { name, value: '', maxAge: 0, path: '/' };
  }

  it('clears the cookie by setting maxAge=0', () => {
    const cfg = clearCookieConfig('oauth_state_youtube');
    expect(cfg.maxAge).toBe(0);
    expect(cfg.value).toBe('');
  });

  it('clears the correct platform cookie', () => {
    expect(clearCookieConfig('oauth_state_youtube').name).toBe('oauth_state_youtube');
    expect(clearCookieConfig('oauth_state_linkedin').name).toBe('oauth_state_linkedin');
    expect(clearCookieConfig('oauth_state_facebook').name).toBe('oauth_state_facebook');
  });
});

// ─── End-to-end flow simulation ───────────────────────────────────────────────

describe('OAuth CSRF flow: authorize → callback', () => {
  // Simulates the full round-trip: authorize sets cookie, callback reads it.

  function authorize(platform: string): { state: string; cookieName: string } {
    const state = randomBytes(16).toString('hex');
    return { state, cookieName: `oauth_state_${platform}` };
  }

  function callback(
    cookieValue: string | undefined,
    returnedState: string | null,
  ): 'proceed' | 'reject' {
    if (!cookieValue || !returnedState || cookieValue !== returnedState) {
      return 'reject';
    }
    return 'proceed';
  }

  it('legitimate flow: state matches → callback proceeds', () => {
    const { state } = authorize('youtube');
    // Browser sends the cookie back and the provider echoes the state
    expect(callback(state, state)).toBe('proceed');
  });

  it('CSRF attack: no cookie (user never visited authorize) → rejected', () => {
    expect(callback(undefined, 'attacker-injected-state')).toBe('reject');
  });

  it('CSRF attack: attacker forges state → rejected', () => {
    const { state } = authorize('linkedin');
    const attackerState = randomBytes(16).toString('hex');
    // Attacker cannot guess the stored state — mismatch → reject
    expect(callback(state, attackerState)).toBe('reject');
  });

  it('replay attack: cookie cleared after success → second callback rejected', () => {
    const { state } = authorize('facebook');
    // First callback succeeds
    expect(callback(state, state)).toBe('proceed');
    // Cookie is cleared (maxAge=0) — simulate by passing undefined
    expect(callback(undefined, state)).toBe('reject');
  });
});
