import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import SettingsFormClient, { SettingsField } from '@/components/admin/settings/SettingsFormClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
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

export default async function SecuritySettingsPage() {
  const auth = await requireRole(['admin']);
  const isSuperAdmin = auth.effectiveRoles.includes('admin');
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', KEYS);

  const initialValues: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );
  if (!initialValues['mfa_required'])    initialValues['mfa_required']    = 'false';
  if (!initialValues['session_timeout']) initialValues['session_timeout'] = '480';
  if (!initialValues['ip_allowlist'])    initialValues['ip_allowlist']    = '';

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Security
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security Settings</h1>
        <p className="text-slate-500">MFA, session management, and IP access controls.</p>
      </div>

      <SettingsFormClient
        fields={FIELDS}
        initialValues={initialValues}
        superAdminOnly
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
