import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emailService } from '@/lib/notifications/email';
import { isQaE2EIdentity } from '@/lib/qa/is-qa-e2e-identity';

/**
 * Platform-owner notifications for portal authentication events.
 *
 * Every portal (Admin, Learner, Apprentice, Host Shop, Program Holder,
 * Employer, Workforce, Instructor, Staff, Marketing/Store) routes sign-in and
 * sign-out through this helper so the owner is told who entered or left which
 * dashboard. Delivery is best-effort and isolated: a mail-provider failure must
 * never block or fail authentication.
 */

const OWNER_ALERT_PROFILE_ID = '964dc85a-bce8-4e67-92eb-198ffafb2384';

export type PortalKind =
  | 'Admin'
  | 'Learner'
  | 'Apprentice'
  | 'Host Shop'
  | 'Program Holder'
  | 'Employer'
  | 'Workforce'
  | 'Instructor'
  | 'Staff'
  | 'Partner'
  | 'Marketing'
  | 'Portal';

export type AuthEvent = 'signin' | 'signout';

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) =>
    char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : '&quot;',
  );
}

/** Resolve the portal a signed-in user belongs to from their profile role. */
export async function resolvePortalKind(
  db: { from: (table: string) => any },
  userId: string,
): Promise<PortalKind> {
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  const role = String(profile?.role || '').trim().toLowerCase();
  if (role === 'program_holder' || role === 'programholder' || role === 'site_coordinator')
    return 'Program Holder';
  if (role === 'employer' || role === 'sponsor' || role === 'recruiter') return 'Employer';
  if (role === 'workforce' || role === 'case_manager') return 'Workforce';
  if (role === 'instructor') return 'Instructor';
  if (role === 'staff') return 'Staff';
  if (role === 'partner' || role === 'partner_admin' || role === 'host_shop' || role === 'host_shop_admin')
    return 'Host Shop';
  if (role.includes('admin')) return 'Admin';
  if (role.includes('apprentice')) return 'Apprentice';
  return 'Learner';
}

export async function notifyPortalAuthEvent(input: {
  event: AuthEvent;
  portal: PortalKind;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  extra?: Record<string, string | null | undefined>;
}): Promise<void> {
  try {
    // Disposable QA identities exercise real auth without staff notifications.
    if (isQaE2EIdentity(input.email)) return;

    const db = await requireAdminClient();
    const { data: owner } = await db
      .from('profiles')
      .select('email')
      .eq('id', OWNER_ALERT_PROFILE_ID)
      .maybeSingle();
    const to =
      owner?.email || process.env.ADMIN_ALERT_EMAIL || process.env.ALERT_EMAIL_TO || '';
    if (!to) return;

    let displayName = input.name?.trim() || input.email?.trim() || 'Portal user';
    if (!input.name && input.userId) {
      const { data: profile } = await db
        .from('profiles')
        .select('full_name,email')
        .eq('id', input.userId)
        .maybeSingle();
      displayName = profile?.full_name || profile?.email || displayName;
    }

    const at = new Date().toISOString();
    const verb = input.event === 'signin' ? 'signed in to' : 'signed out of';
    const label = input.event === 'signin' ? 'sign-in' : 'sign-out';
    const detail = Object.entries(input.extra || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    await emailService.send({
      to,
      subject: `${input.portal} portal ${label}: ${displayName}`,
      text: `${displayName} ${verb} the ${input.portal} portal at ${at}.${detail ? ` (${detail})` : ''}`,
      html: `<p><strong>${escapeHtml(displayName)}</strong> ${verb} the ${escapeHtml(
        input.portal,
      )} portal.</p>${detail ? `<p>${escapeHtml(detail)}</p>` : ''}<p>Time: ${at}</p>`,
    });
  } catch {
    // Authentication already succeeded; monitoring is best-effort and isolated.
  }
}
