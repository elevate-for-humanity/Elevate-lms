import { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { Settings, Bell, Shield, CreditCard, Globe, Mail, Webhook } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Settings | Admin' };

const SETTING_SECTIONS = [
  { title: 'Platform Settings',    desc: 'Site name, timezone, feature flags, maintenance mode',  href: '/admin/settings/platform',      icon: Globe },
  { title: 'Notifications',        desc: 'Email templates, SMS alerts, admin notification rules', href: '/admin/settings/notifications',  icon: Bell },
  { title: 'Security & Access',    desc: 'Roles, permissions, session timeout, 2FA policy',       href: '/admin/settings/security',       icon: Shield },
  { title: 'Payments & Billing',   desc: 'Stripe keys, payment methods, refund policy',           href: '/admin/settings/payments',       icon: CreditCard },
  { title: 'Email Configuration',  desc: 'SMTP settings, sender domain, email logs',              href: '/admin/settings/email',          icon: Mail },
  { title: 'Webhooks',             desc: 'Stripe webhooks, Zoom, Google Calendar integrations',   href: '/admin/settings/webhooks',       icon: Webhook },
];

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <AdminPageShell
      title="Settings"
      description="Platform configuration, integrations, and access control"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Settings' }]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SETTING_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                <p className="text-slate-500 text-sm mt-0.5">{s.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
