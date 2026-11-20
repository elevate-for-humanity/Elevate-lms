import { resolveServerSupabaseRawEnv } from '@/lib/supabase/public-config';

const ISOLATED_QA_SUPABASE_HOST = 'isdgjcdabhxxozarmxta.supabase.co';

export function shouldSuppressIsolatedQaApprovalNotifications(
  recipient: string,
  supabaseUrl = resolveServerSupabaseRawEnv().url,
): boolean {
  let host: string;
  try {
    host = new URL(supabaseUrl ?? '').hostname.toLowerCase();
  } catch {
    return false;
  }

  const normalizedRecipient = recipient.trim().toLowerCase();
  const at = normalizedRecipient.lastIndexOf('@');
  if (at <= 0 || at === normalizedRecipient.length - 1) return false;
  const domain = normalizedRecipient.slice(at + 1);

  return (
    host === ISOLATED_QA_SUPABASE_HOST &&
    (domain === 'invalid' || domain.endsWith('.invalid'))
  );
}
