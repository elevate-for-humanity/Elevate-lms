/**
 * User-facing auth errors — map Supabase / network messages to actionable copy.
 */
export function mapAuthError(message: string | undefined | null): string {
  const raw = (message ?? '').trim();
  const lower = raw.toLowerCase();

  if (!raw) return 'Sign-in failed. Please try again.';

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many sign-in attempts. Please wait 10–15 minutes and try again, or contact support if this continues.';
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Invalid email or password. Check your credentials or reset your password.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for the verification link.';
  }

  if (lower.includes('supabase not configured') || lower.includes('site configuration')) {
    return 'Sign-in is temporarily unavailable. Please try again later or contact support.';
  }

  return raw;
}
