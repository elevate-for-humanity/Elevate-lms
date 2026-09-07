import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import Link from 'next/link';
import { Bell, Shield, CreditCard, Globe, Mail, Webhook, ArrowRight, Share2 } from 'lucide-react';
import { RUNTIME_INTEGRATIONS, runtimeConfiguration } from '@/lib/integrations/runtime-status';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Settings | Admin',
};

export default async function AdminSettingsPage() {
  await requireRole(['admin']);
  // The settings overview must report the effective Admin runtime, not stale
  // display values from platform_settings. This also loads secrets from the
  // canonical protected store when they are not injected into the container.
  await hydrateProcessEnv();
  const db = await requireAdminClient();

  const [{ data: settingsRows }, { data: socialRows }] = await Promise.all([
    db.from('platform_settings').select('key, value, updated_at').order('key'),
    db.from('social_media_settings').select('platform, access_token, expires_at'),
  ]);
  const settings: Record<string, string> = Object.fromEntries(
    (settingsRows ?? []).map((r: any) => [r.key, r.value]),
  );

  const configuredIntegrations = RUNTIME_INTEGRATIONS.filter(
    (item) => runtimeConfiguration(item.id).configured,
  );
  const webhookIntegrations = RUNTIME_INTEGRATIONS.filter((item) => item.webhook);
  const configuredWebhooks = webhookIntegrations.filter(
    (item) => runtimeConfiguration(item.id).configured,
  ).length;
  const connectedSocial = new Set(
    (socialRows ?? [])
      .filter((row: any) => {
        const expired = row.expires_at ? new Date(row.expires_at).getTime() <= Date.now() : false;
        return Boolean(row.access_token) && !expired;
      })
      .map((row: any) => row.platform),
  );
  const socialStatus = (platform: string) =>
    connectedSocial.has(platform) ? 'Connected' : 'Not connected';
  const isSensitiveSetting = (key: string) =>
    /(?:secret|token|password|api[_-]?key|private[_-]?key|webhook)/i.test(key);

  const sections = [
    {
      title: 'General',
      icon: Globe,
      href: '/settings/general',
      fields: [
        { label: 'Site Name', value: settings['site_name'] ?? '—' },
        { label: 'Support Email', value: settings['support_email'] ?? '—' },
        { label: 'Contact Phone', value: settings['contact_phone'] ?? '—' },
        { label: 'Timezone', value: settings['timezone'] ?? '—' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      href: '/settings/notifications',
      fields: [
        { label: 'Email Notifications', value: settings['email_notifications'] ?? '—' },
        { label: 'SMS Notifications', value: settings['sms_notifications'] ?? '—' },
        { label: 'Slack Webhook', value: settings['slack_webhook'] ? 'Configured' : 'Not set' },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      href: '/settings/security',
      fields: [
        { label: 'MFA Required', value: settings['mfa_required'] ?? '—' },
        { label: 'Session Timeout', value: settings['session_timeout'] ?? '—' },
        { label: 'IP Allowlist', value: settings['ip_allowlist'] ?? 'Disabled' },
      ],
    },
    {
      title: 'Payments',
      icon: CreditCard,
      href: '/settings/payments',
      fields: [
        { label: 'Stripe Mode', value: settings['stripe_mode'] ?? '—' },
        { label: 'Currency', value: settings['currency'] ?? 'USD' },
        { label: 'Payment Methods', value: settings['payment_methods'] ?? '—' },
      ],
    },
    {
      title: 'Email',
      icon: Mail,
      href: '/settings/email',
      fields: [
        { label: 'From Name', value: settings['email_from_name'] ?? '—' },
        { label: 'From Address', value: settings['email_from_address'] ?? '—' },
        { label: 'Provider', value: settings['email_provider'] ?? '—' },
      ],
    },
    {
      title: 'Social Media Accounts',
      icon: Share2,
      href: '/settings/social-media',
      fields: [
        {
          label: 'Facebook',
          value: socialStatus('facebook'),
        },
        {
          label: 'Instagram',
          value: socialStatus('instagram'),
        },
        {
          label: 'YouTube',
          value: socialStatus('youtube'),
        },
        {
          label: 'LinkedIn',
          value: socialStatus('linkedin'),
        },
      ],
    },
    {
      title: 'Integrations & Webhooks',
      icon: Webhook,
      href: '/settings/integrations',
      fields: [
        {
          label: 'Configured Integrations',
          value: `${configuredIntegrations.length} of ${RUNTIME_INTEGRATIONS.length}`,
        },
        {
          label: 'Webhook Endpoints',
          value: `${configuredWebhooks} of ${webhookIntegrations.length} configured`,
        },
      ],
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Admin</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500">Configure platform behavior, integrations, and security.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-brand-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors" />
              </div>
              <h2 className="font-semibold text-slate-900 mb-3">{section.title}</h2>
              <div className="space-y-2">
                {section.fields.map((f) => (
                  <div key={f.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{f.label}</span>
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[120px] text-right">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Raw settings table for admin */}
      {settingsRows && settingsRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">All Platform Settings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Key', 'Value', 'Last Updated'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {settingsRows.map((r: any) => (
                  <tr key={r.key} className="hover:bg-slate-50">
                    <td className="py-3 px-5 font-mono text-xs text-slate-700">{r.key}</td>
                    <td className="py-3 px-5 text-slate-600 text-xs max-w-xs truncate">
                      {isSensitiveSetting(r.key) && r.value ? '••••••••' : (r.value ?? '—')}
                    </td>
                    <td className="py-3 px-5 text-slate-400 text-xs">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
