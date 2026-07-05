import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import Link from 'next/link';
import { GeneralSettingsClient } from './GeneralSettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = { title: 'General Settings | Admin' };

export default async function GeneralSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: rows } = await db
    .from('platform_settings')
    .select('key, value')
    .in('key', ['site_name', 'support_email', 'contact_phone', 'timezone']);

  const settings: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value ?? '']),
  );

  // Fall back to PLATFORM_DEFAULTS so the form shows the active value, not blank
  if (!settings['site_name'])     settings['site_name']     = PLATFORM_DEFAULTS.orgName;
  if (!settings['support_email']) settings['support_email'] = PLATFORM_DEFAULTS.supportEmail;
  if (!settings['contact_phone']) settings['contact_phone'] = PLATFORM_DEFAULTS.supportPhone;
  if (!settings['timezone'])      settings['timezone']      = 'America/Indiana/Indianapolis';

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / General
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">General Settings</h1>
        <p className="text-slate-500">
          Site identity, contact details, and timezone configuration.
        </p>
      </div>
      <div className="max-w-xl">
        <GeneralSettingsClient initialSettings={settings} />
      </div>
    </div>
  );
}
