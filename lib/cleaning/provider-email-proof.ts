import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { CLEANING_SITE, CleaningError } from './server';

export type ProviderProofDatabase = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
};

export const providerVerificationRequired = () => new CleaningError(
  'Open a secure email sign-in link to access your cleaning provider profile.',
  403,
  'provider_email_verification_required',
);

/**
 * Provider rows are owned by email, so even an existing profile needs proof of
 * mailbox access. email_confirmed_at can be set by automatic confirmation and
 * user_metadata is editable; neither establishes that proof. The current Auth
 * user's confirmed email remains a prerequisite alongside the signed proof.
 *
 * Supabase's PKCE magiclink AMR is email-specific. Generic otp also covers SMS,
 * and email/signup can be issued without opening a mailbox. Only getClaims()
 * output is used: the SDK verifies the JWT signature and expiration first.
 * AMR does not bind an old session to a changed mailbox. Provider access also
 * requires the server-owned, same-browser PKCE receipt below.
 * https://supabase.com/docs/guides/auth/auth-mfa#authentication-method-reference
 */
export async function verifiedProviderSession(
  user: User | null,
  session: Pick<SupabaseClient, 'auth'>,
  requireMagicLink = true,
) {
  if (!user?.id || !user.email || !user.email_confirmed_at) {
    throw new CleaningError('Sign in with a verified account email to continue.', 401);
  }

  let verified: Awaited<ReturnType<typeof session.auth.getClaims>>;
  try {
    verified = await session.auth.getClaims();
  } catch {
    throw providerVerificationRequired();
  }
  const claims = verified.data?.claims;
  const now = Math.floor(Date.now() / 1000);
  const email = user.email.toLowerCase();
  if (
    verified.error ||
    !claims ||
    claims.sub !== user.id ||
    typeof claims.email !== 'string' ||
    claims.email.toLowerCase() !== email ||
    claims.role !== 'authenticated' ||
    claims.is_anonymous === true ||
    user.is_anonymous === true ||
    typeof claims.session_id !== 'string' ||
    !claims.session_id ||
    !Number.isFinite(claims.iat) ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now ||
    (requireMagicLink && (!Array.isArray(claims.amr) || !claims.amr.some(
      (method) =>
        typeof method === 'object' &&
        method !== null &&
        method.method === 'magiclink' &&
        Number.isFinite(method.timestamp) &&
        method.timestamp > 0 &&
        method.timestamp <= claims.iat &&
        method.timestamp <= now + 60,
    )))
  ) {
    throw providerVerificationRequired();
  }

  return { id: user.id, email, sessionId: claims.session_id };
}

export async function verifiedProviderEmail(
  user: User | null,
  session: Pick<SupabaseClient, 'auth'>,
  db: ProviderProofDatabase,
  websiteId = CLEANING_SITE,
) {
  const actor = await verifiedProviderSession(user, session);
  const { data, error } = await db.rpc('cleaning_provider_proof_valid', {
    p_website_id: websiteId, p_user_id: actor.id,
    p_session_id: actor.sessionId, p_email: actor.email,
  });
  if (error || data !== true) throw providerVerificationRequired();
  return { id: actor.id, email: actor.email };
}
