'use server';

// "use server" files cannot use re-exports — Next.js requires functions to be
// defined directly in the file. Delegate to the canonical implementation.
import { sendRecoveryEmail as _sendRecoveryEmail } from '@/app/forgot-password/actions';

export async function sendRecoveryEmail(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  return _sendRecoveryEmail(email);
}
