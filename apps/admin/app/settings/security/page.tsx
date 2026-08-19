import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import SettingsFormClient, { SettingsField } from '@/components/admin/settings/SettingsFormClient';
import MfaEnrollmentCard from '../../../components/security/MfaEnrollmentCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Security | Admin Settings' };

const KEYS = ['mfa_required', 'session_timeout', 'ip_allowlist'];

const FIELDS: SettingsField[] = [
  {
    key: 'mfa_required',
    label: 'MFA Required',
    description: 'Require multi-factor authentication for admin users',
    type: 'toggle',
  },
  {
    key: 'session_timeout',
    label: 'Session Timeout',
    description: 'Auto-logout after idle period (minutes)',
    type: 'number',
    placeholder: '480',
  },
  {
    key: 'ip_allowlist',
    label: 'IP Allowlist',
    description: 'Comma-separated IPs allowed to access admin (empty = disabled)',
    type: 'text',
    placeholder: '203.0.113.0,198.51.100.0',
    readonlyNote: 'Can also be set via ADMIN_IP_ALLOWLIST env var in Dev Studio → Secrets.',
  },
];

type MfaPosture = {
  privileged_users: number;
  users_with_verified_mfa: number;
  users_without_verified_mfa: number;
  verified_totp_factors: number;
  verified_phone_factors: number;
};

export default async function SecuritySettingsPage() {
  const auth = await requireRole(['admin']);
  const isSuperAdmin = auth.effectiveRoles.includes('admin');
  const db = await requireAdminClient();

  const [{ data: rows }, { data: postureRows, error: postureError }] = await Promise.all([
    db.from('platform_settings').select('key, value').in('key', KEYS),
    db.rpc('privileged_mfa_posture'),
  ]);

  const initialValues: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );
  if (!initialValues['mfa_required']) initialValues['mfa_required'] = 'false';
  if (!initialValues['session_timeout']) initialValues['session_timeout'] = '480';
  if (!initialValues['ip_allowlist']) initialValues['ip_allowlist'] = '';

  const posture = (postureRows?.[0] ?? null) as MfaPosture | null;
  const coverage = posture?.privileged_users
    ? Math.round((posture.users_with_verified_mfa / posture.privileged_users) * 100)
    : 0;

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/settings" className="hover:text-slate-700">Settings</Link> / Security
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security Settings</h1>
        <p className="text-slate-500">MFA, session management, and IP access controls.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Privileged MFA posture</h2>
            <p className="text-sm text-slate-500">Live Supabase factor coverage for privileged roles.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${coverage === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {coverage}% covered
          </span>
        </div>

        {postureError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            MFA posture could not be loaded: {postureError.message}
          </div>
        ) : posture ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Privileged users</div><div className="text-2xl font-bold text-slate-900">{posture.privileged_users}</div></div>
              <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">With verified MFA</div><div className="text-2xl font-bold text-slate-900">{posture.users_with_verified_mfa}</div></div>
              <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Missing verified MFA</div><div className="text-2xl font-bold text-slate-900">{posture.users_without_verified_mfa}</div></div>
              <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Verified TOTP factors</div><div className="text-2xl font-bold text-slate-900">{posture.verified_totp_factors}</div></div>
              <div className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">Verified phone factors</div><div className="text-2xl font-bold text-slate-900">{posture.verified_phone_factors}</div></div>
            </div>
            {posture.users_without_verified_mfa > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Privileged accounts without a verified second factor remain a production security gap. Enroll a TOTP factor below before enforcing AAL2 for those users.
              </div>
            )}
          </>
        ) : null}
      </section>

      <MfaEnrollmentCard />

      <SettingsFormClient
        fields={FIELDS}
        initialValues={initialValues}
        superAdminOnly
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
