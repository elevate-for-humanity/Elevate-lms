// @vitest-environment node
import { generateKeyPairSync, sign } from 'node:crypto';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { verifiedProviderEmail } from '@/lib/cleaning/provider-email-proof';
import { CLEANING_SITE } from '@/lib/cleaning/server';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = {
  ...publicKey.export({ format: 'jwk' }),
  kid: 'provider-proof-test',
  alg: 'RS256',
  use: 'sig',
};
const user = {
  id: 'provider-user',
  email: 'provider@example.invalid',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  is_anonymous: false,
} as User;
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

function claims(method = 'magiclink') {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: 'https://provider-proof.example.invalid/auth/v1',
    aud: 'authenticated',
    sub: user.id,
    email: user.email,
    role: 'authenticated',
    session_id: 'provider-session',
    iat: now,
    exp: now + 3600,
    amr: [{ method, timestamp: now }],
  };
}

function signedToken(payload: ReturnType<typeof claims>) {
  const value = `${encode({ alg: 'RS256', typ: 'JWT', kid: jwk.kid })}.${encode(payload)}`;
  return `${value}.${sign('RSA-SHA256', Buffer.from(value), privateKey).toString('base64url')}`;
}

function session(token: string) {
  const client = createClient('https://provider-proof.example.invalid', 'public-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (request) => {
        const url =
          typeof request === 'string'
            ? request
            : request instanceof URL
              ? request.href
              : request.url;
        if (!url.endsWith('/auth/v1/.well-known/jwks.json'))
          throw new Error('Unexpected test auth request');
        return new Response(JSON.stringify({ keys: [jwk] }), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  });
  // Exercise the installed Supabase SDK's real signature verification, while
  // keeping the test's token and public key entirely local.
  return { auth: { getClaims: () => client.auth.getClaims(token) } } as Pick<
    SupabaseClient,
    'auth'
  >;
}

describe('provider email proof with cryptographically verified Supabase claims', () => {
  const proof = (data: unknown = true, error: unknown = null) => ({ rpc: vi.fn(async (_name: string, _args: Record<string, unknown>) => ({ data, error })) });

  it('accepts a signed email magic-link session only with its exact server-recorded mailbox proof', async () => {
    const db = proof();
    await expect(verifiedProviderEmail(user, session(signedToken(claims())), db)).resolves.toEqual({
      id: user.id,
      email: user.email,
    });
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith('cleaning_provider_proof_valid', {
      p_website_id: CLEANING_SITE, p_user_id: user.id, p_session_id: 'provider-session', p_email: user.email,
    });
  });

  it('rejects a password token whose payload was edited to claim magic-link authentication', async () => {
    const token = signedToken(claims('password'));
    const [header, , signature] = token.split('.');
    const forged = `${header}.${encode(claims('magiclink'))}.${signature}`;
    const db = proof();
    await expect(verifiedProviderEmail(user, session(forged), db)).rejects.toMatchObject({
      status: 403,
      code: 'provider_email_verification_required',
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('rejects an expired signed magic-link token', async () => {
    const payload = { ...claims(), exp: 1 };
    await expect(verifiedProviderEmail(user, session(signedToken(payload)), proof())).rejects.toMatchObject({
      status: 403,
      code: 'provider_email_verification_required',
    });
  });

  it.each([false, null, {}, 'true'])('rejects a direct magic-link login without a boolean server proof (%j)', async data => {
    await expect(verifiedProviderEmail(user, session(signedToken(claims())), proof(data))).rejects.toMatchObject({ status: 403 });
  });

  it('rejects an old magic-link session refreshed with a changed email', async () => {
    const changed = { ...user, email: 'changed@example.invalid' };
    const db = proof(false);
    await expect(verifiedProviderEmail(changed, session(signedToken({ ...claims(), email: changed.email })), db)).rejects.toMatchObject({ status: 403 });
    expect(db.rpc.mock.calls[0][1]).toMatchObject({ p_email: changed.email, p_session_id: 'provider-session' });
  });

  it('fails closed when proof storage is unavailable', async () => {
    await expect(verifiedProviderEmail(user, session(signedToken(claims())), proof(null, { message: 'database unavailable' }))).rejects.toMatchObject({ status: 403 });
  });

  it('still rejects an unconfirmed current Auth user even with a stored proof', async () => {
    const db = proof();
    await expect(verifiedProviderEmail({ ...user, email_confirmed_at: undefined }, session(signedToken(claims())), db)).rejects.toMatchObject({ status: 401 });
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
