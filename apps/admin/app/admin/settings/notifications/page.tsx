import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import SettingsFormClient, { SettingsField } from '@/components/admin/settings/SettingsFormClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = { title: 'Notifications | Admin Settings' };

const KEYS = ['email_notifications', 'sms_notifications', 'slack_webhook'];

const FIELDS: SettingsField[] = [
  {
    key: 'email_notifications',
    label: 'Email Notifications',
    description: 'Send enrollment and progress email alerts',
    type: 'toggle',
  },
  {
    key: 'sms_notifications',
    label: 'SMS Notifications',
    description: 'Text message alerts for critical events',
    type: 'toggle',
  },
  {
    key: 'slack_webhook',
    label: 'Slack Webhook URL',
    description: 'Post notifications to a Slack channel',
    type: 'text',
    placeholder: 'https://hooks.slack.com/services/…',
    readonlyNote: 'Paste your Slack incoming webhook URL. Leave blank to disable.',
  },
];

export default async function NotificationSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', KEYS);

  const initialValues: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );
  if (!initialValues['email_notifications']) initialValues['email_notifications'] = 'true';
  if (!initialValues['sms_notifications'])   initialValues['sms_notifications']   = 'false';
  if (!initialValues['slack_webhook'])       initialValues['slack_webhook']       = '';

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Notifications
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notification Settings</h1>
        <p className="text-slate-500">Configure email, SMS, and webhook notifications.</p>
      </div>

      <SettingsFormClient fields={FIELDS} initialValues={initialValues} />

      <p className="text-xs text-slate-400 max-w-xl">
        Email API keys (SendGrid, Resend, SMTP) are configured in{' '}
        <Link href="/admin/settings/integrations" className="text-brand-blue-600 underline">
          Dev Studio → Secrets
        </Link>.
      </p>
    </div>
  );
}
