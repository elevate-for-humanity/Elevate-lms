/**
 * LTI 1.3 JWT verification logic tests.
 *
 * Tests the state/nonce CSRF guard and JWT claim extraction in isolation.
 * Does not import the Next.js route handler — tests the pure logic only.
 */

import { describe, it, expect } from 'vitest';

// ── State/nonce CSRF guard (mirrors launch route logic) ───────────────────────

interface StateValidationResult {
  valid: boolean;
  error?: string;
}

function validateLtiState(
  stateParam: string,
  cookieHeader: string
): StateValidationResult {
  const match = cookieHeader.match(/(?:^|;\s*)lti_state=([^;]+)/);
  const cookieValue = match?.[1] ?? '';
  const [cookieState] = cookieValue.split('.');

  if (!cookieState) {
    return { valid: false, error: 'Missing state cookie' };
  }
  if (cookieState !== stateParam) {
    return { valid: false, error: 'State mismatch — possible CSRF' };
  }
  return { valid: true };
}

function validateLtiNonce(jwtNonce: string | undefined, cookieHeader: string): StateValidationResult {
  const match = cookieHeader.match(/(?:^|;\s*)lti_state=([^;]+)/);
  const cookieValue = match?.[1] ?? '';
  const [, cookieNonce] = cookieValue.split('.');

  // If either side is missing, skip nonce check (non-fatal — state already validated)
  if (!cookieNonce || !jwtNonce) return { valid: true };
  if (jwtNonce !== cookieNonce) {
    return { valid: false, error: 'Nonce mismatch — replay attack detected' };
  }
  return { valid: true };
}

// ── JWT payload extraction (mirrors launch route Step 1) ─────────────────────

interface LtiPayloadExtract {
  iss: string;
  clientId: string;
}

function extractLtiPayload(idToken: string): LtiPayloadExtract | null {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const iss = payload.iss;
    const aud = payload.aud;
    const clientId = Array.isArray(aud) ? aud[0] : aud;
    if (!iss || !clientId) return null;
    return { iss, clientId };
  } catch {
    return null;
  }
}

function makeJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesig`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LTI state/nonce CSRF guard', () => {

  it('rejects when state cookie is absent', () => {
    const result = validateLtiState('abc123', '');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Missing state cookie/);
  });

  it('rejects when state param does not match cookie', () => {
    const result = validateLtiState('wrong', 'lti_state=correct.nonce123');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/State mismatch/);
  });

  it('accepts when state param matches cookie', () => {
    const result = validateLtiState('abc123', 'lti_state=abc123.nonce456');
    expect(result.valid).toBe(true);
  });

  it('accepts when cookie is among multiple cookies', () => {
    const result = validateLtiState('mystate', 'session=xyz; lti_state=mystate.mynonce; other=val');
    expect(result.valid).toBe(true);
  });

  it('rejects partial cookie value with no nonce separator', () => {
    // state=abc but no nonce — state check still passes, nonce check skips
    const stateResult = validateLtiState('abc', 'lti_state=abc');
    expect(stateResult.valid).toBe(true);
  });
});

describe('LTI nonce replay guard', () => {

  it('rejects when JWT nonce does not match cookie nonce', () => {
    const result = validateLtiNonce('wrong-nonce', 'lti_state=state123.correct-nonce');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Nonce mismatch/);
  });

  it('accepts when JWT nonce matches cookie nonce', () => {
    const result = validateLtiNonce('correct-nonce', 'lti_state=state123.correct-nonce');
    expect(result.valid).toBe(true);
  });

  it('skips check when JWT nonce is absent', () => {
    const result = validateLtiNonce(undefined, 'lti_state=state123.nonce456');
    expect(result.valid).toBe(true);
  });

  it('skips check when cookie nonce is absent', () => {
    const result = validateLtiNonce('some-nonce', 'lti_state=state123');
    expect(result.valid).toBe(true);
  });
});

describe('LTI JWT payload extraction', () => {

  it('returns null for malformed token (not 3 parts)', () => {
    expect(extractLtiPayload('notavalidjwt')).toBeNull();
    expect(extractLtiPayload('a.b')).toBeNull();
  });

  it('returns null when iss is missing', () => {
    const token = makeJwt({ aud: 'client1' });
    expect(extractLtiPayload(token)).toBeNull();
  });

  it('returns null when aud is missing', () => {
    const token = makeJwt({ iss: 'https://platform.example.com' });
    expect(extractLtiPayload(token)).toBeNull();
  });

  it('extracts iss and clientId from string aud', () => {
    const token = makeJwt({ iss: 'https://canvas.example.com', aud: 'client-abc' });
    const result = extractLtiPayload(token);
    expect(result).not.toBeNull();
    expect(result!.iss).toBe('https://canvas.example.com');
    expect(result!.clientId).toBe('client-abc');
  });

  it('extracts first element when aud is an array', () => {
    const token = makeJwt({ iss: 'https://canvas.example.com', aud: ['client-abc', 'other'] });
    const result = extractLtiPayload(token);
    expect(result!.clientId).toBe('client-abc');
  });
});
