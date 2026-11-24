import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { CleaningError } from './server';

/**
 * Provider rows are owned by email, so even an existing profile needs proof of
 * mailbox access. email_confirmed_at can be set by automatic confirmation and
 * user_metadata is editable; neither establishes that proof. The current Auth
 * user's confirmed email remains a prerequisite alongside the signed proof.
 *
 * Supabase's PKCE magiclink AMR is email-specific. Generic otp also covers SMS,
 * and email/signup can be issued without opening a mailbox. Only getClaims()
 * output is used: the SDK verifies the JWT signature and expiration first.
 * https://supabase.com/docs/guides/auth/auth-mfa#authentication-method-reference
 */
export async function verifiedProviderEmail(
  user: User | null,
  session: Pick<SupabaseClient, 'auth'>,
) {
  if (!user?.id || !user.email || !user.email_confirmed_at) {
    throw new CleaningError('Sign in with a verified account email to continue.', 401);
  }

  const verificationRequired = () =>
    new CleaningError(
      'Open a secure email sign-in link to access your cleaning provider profile.',
      403,
      'provider_email_verification_required',
    );

  let verified: Awaited<ReturnType<typeof session.auth.getClaims>>;
  try {
    verified = await session.auth.getClaims();
  } catch {
    throw verificationRequired();
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
    !Array.isArray(claims.amr) ||
    !claims.amr.some(
      (method) =>
        typeof method === 'object' &&
        method !== null &&
        method.method === 'magiclink' &&
        Number.isFinite(method.timestamp) &&
        method.timestamp > 0 &&
        method.timestamp <= claims.iat &&
        method.timestamp <= now + 60,
    )
  ) {
    throw verificationRequired();
  }

  return { id: user.id, email };
}
