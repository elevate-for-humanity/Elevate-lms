// @vitest-environment node
import { generateKeyPairSync, sign } from 'node:crypto';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { verifiedProviderEmail } from '@/lib/cleaning/provider-email-proof';

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
  it('accepts a signed email magic-link session for the matching Auth user', async () => {
    await expect(verifiedProviderEmail(user, session(signedToken(claims())))).resolves.toEqual({
      id: user.id,
      email: user.email,
    });
  });

  it('rejects a password token whose payload was edited to claim magic-link authentication', async () => {
    const token = signedToken(claims('password'));
    const [header, , signature] = token.split('.');
    const forged = `${header}.${encode(claims('magiclink'))}.${signature}`;
    await expect(verifiedProviderEmail(user, session(forged))).rejects.toMatchObject({
      status: 403,
      code: 'provider_email_verification_required',
    });
  });

  it('rejects an expired signed magic-link token', async () => {
    const payload = { ...claims(), exp: 1 };
    await expect(verifiedProviderEmail(user, session(signedToken(payload)))).rejects.toMatchObject({
      status: 403,
      code: 'provider_email_verification_required',
    });
  });
});
