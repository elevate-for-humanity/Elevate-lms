/**
 * Licensing Mode Control
 * 
 * LICENSING_MODE=controlled - Only admin-generated checkout sessions allowed
 * LICENSING_MODE=open - Public checkout allowed (development only)
 */

import { createClient } from '@supabase/supabase-js';

export type LicensingMode = 'controlled' | 'open';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function getLicensingMode(): LicensingMode {
  const mode = process.env.LICENSING_MODE;
  if (mode === 'controlled') return 'controlled';
  // 'open', 'production', or any other value → open (public checkout allowed)
  if (mode) return 'open';
  // No env var set: open in all environments
  return 'open';
}

export function isLicensingControlled(): boolean {
  return getLicensingMode() === 'controlled';
}

/**
 * Validate admin session against database
 */
async function validateAdminSession(sessionId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data: session } = await supabase
    .from('admin_checkout_sessions')
    .select('id, expires_at, used')
    .eq('id', sessionId)
    .single();

  if (!session) return false;
  if (session.used) return false;
  if (new Date(session.expires_at) < new Date()) return false;

  return true;
}

/**
 * Validate approved payment link
 */
async function validatePaymentLink(linkId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data: link } = await supabase
    .from('approved_payment_links')
    .select('id, expires_at, max_uses, use_count, active')
    .eq('id', linkId)
    .single();

  if (!link) return false;
  if (!link.active) return false;
  if (link.expires_at && new Date(link.expires_at) < new Date()) return false;
  if (link.max_uses && link.use_count >= link.max_uses) return false;

  return true;
}

/**
 * Validate that a checkout request is authorized
 * In controlled mode, requires admin session or approved payment link
 */
export async function validateCheckoutAuthorization(
  adminSessionId?: string,
  approvedLinkId?: string
): Promise<{ authorized: boolean; reason?: string }> {
  if (!isLicensingControlled()) {
    return { authorized: true };
  }

  if (adminSessionId) {
    const isValid = await validateAdminSession(adminSessionId);
    if (isValid) {
      return { authorized: true };
    }
    return { authorized: false, reason: 'Invalid or expired admin session' };
  }

  if (approvedLinkId) {
    const isValid = await validatePaymentLink(approvedLinkId);
    if (isValid) {
      return { authorized: true };
    }
    return { authorized: false, reason: 'Invalid or expired payment link' };
  }

  return {
    authorized: false,
    reason: 'Checkout requires admin authorization in controlled mode',
  };
}
