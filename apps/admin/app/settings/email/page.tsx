import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import Link from 'next/link';
import SettingsFormClient, { SettingsField } from '@/components/admin/settings/SettingsFormClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = { title: 'Email | Admin Settings' };

const KEYS = ['email_from_name', 'email_from_address', 'email_provider'];

const FIELDS: SettingsField[] = [
  {
    key: 'email_from_name',
    label: 'From Name',
    description: 'Display name on outbound emails',
    type: 'text',
    placeholder: PLATFORM_DEFAULTS.emailFromName,
  },
  {
    key: 'email_from_address',
    label: 'From Address',
    description: 'Sender email address',
    type: 'text',
    placeholder: PLATFORM_DEFAULTS.emailFromAddress,
  },
  {
    key: 'email_provider',
    label: 'Provider',
    description: 'Active email delivery service',
    type: 'select',
    options: [
      { value: 'sendgrid', label: 'SendGrid' },
      { value: 'resend',   label: 'Resend'   },
      { value: 'smtp',     label: 'SMTP'     },
    ],
  },
];

export default async function EmailSettingsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', KEYS);

  const initialValues: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );
  // Fall back to PLATFORM_DEFAULTS so the form shows the active value, not blank
  if (!initialValues['email_from_name'])    initialValues['email_from_name']    = PLATFORM_DEFAULTS.emailFromName;
  if (!initialValues['email_from_address']) initialValues['email_from_address'] = PLATFORM_DEFAULTS.emailFromAddress;
  if (!initialValues['email_provider'])     initialValues['email_provider']     = 'sendgrid';

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Email
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Settings</h1>
        <p className="text-slate-500">Sender identity, provider configuration, and email templates.</p>
      </div>

      <SettingsFormClient fields={FIELDS} initialValues={initialValues} />

      <p className="text-xs text-slate-400 max-w-xl">
        Email API keys (SendGrid, Resend, SMTP) are configured in{' '}
        <Link href="/admin/settings/integrations" className="text-brand-blue-600 underline">
          Dev Studio → Secrets
        </Link>{' '}
        or the{' '}
        <Link href="/admin/integrations/env-manager" className="text-brand-blue-600 underline">
          Env Manager
        </Link>.
        Values saved here override the <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_EMAIL_FROM_*</code> env vars at runtime.
      </p>
    </div>
  );
}
