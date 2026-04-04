import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { Settings, Bell, Shield, CreditCard, Globe, Mail, Webhook, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Settings | Admin' };

const SECTIONS = [
  { title: 'Platform Settings',   desc: 'Site name, timezone, feature flags, maintenance mode',  href: '/admin/settings/platform',     icon: Globe },
  { title: 'Notifications',       desc: 'Email templates, SMS alerts, admin notification rules', href: '/admin/settings/notifications', icon: Bell },
  { title: 'Security & Access',   desc: 'Roles, permissions, session timeout, 2FA policy',       href: '/admin/settings/security',     icon: Shield },
  { title: 'Payments & Billing',  desc: 'Stripe keys, payment methods, refund policy',           href: '/admin/settings/payments',     icon: CreditCard },
  { title: 'Email Configuration', desc: 'SMTP settings, sender domain, email logs',              href: '/admin/settings/email',        icon: Mail },
  { title: 'Webhooks',            desc: 'Stripe webhooks, Zoom, Google Calendar integrations',   href: '/admin/settings/webhooks',     icon: Webhook },
];

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Settings</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Platform configuration, integrations, and access control</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.href} href={s.href}
                className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
