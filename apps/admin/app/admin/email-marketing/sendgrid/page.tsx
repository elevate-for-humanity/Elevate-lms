import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import SendGridSettingsClient from './SendGridSettingsClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `SendGrid Settings | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  robots: { index: false, follow: false },
};

export default async function SendGridSettingsPage() {
  await requireRole(['admin', 'super_admin']);

  const apiKeyConfigured = !!(
    process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY
  );

  const fromEmail =
    process.env.EMAIL_FROM?.replace(/^.*<(.+)>$/, '$1') ||
    process.env.SENDGRID_FROM ||
    PLATFORM_DEFAULTS.emailFromAddress;

  const replyTo =
    process.env.EMAIL_REPLY_TO ||
    process.env.REPLY_TO_EMAIL ||
    'elevate4humanityedu@gmail.com';

  // Check domain verification status via SendGrid API
  let domainVerified: boolean | null = null;
  if (apiKeyConfigured) {
    try {
      const key = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY;
      const res = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const domains: any[] = await res.json();
        const match = domains.find(
          (d: any) =>
            d.domain === PLATFORM_DEFAULTS.canonicalDomain ||
            d.subdomain?.endsWith(PLATFORM_DEFAULTS.canonicalDomain),
        );
        domainVerified = match?.valid === true;
      }
    } catch {
      domainVerified = null;
    }
  }

  // Fetch 30-day stats via SendGrid Stats API
  let stats = null;
  if (apiKeyConfigured) {
    try {
      const key = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY;
      const end = new Date();
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      const res = await fetch(
        `https://api.sendgrid.com/v3/stats?start_date=${fmt(start)}&end_date=${fmt(end)}&aggregated_by=month`,
        {
          headers: { Authorization: `Bearer ${key}` },
          next: { revalidate: 0 },
        },
      );
      if (res.ok) {
        const data: any[] = await res.json();
        const totals = data.reduce(
          (acc: any, day: any) => {
            const m = day.stats?.[0]?.metrics ?? {};
            acc.sent += m.requests ?? 0;
            acc.delivered += m.delivered ?? 0;
            acc.opens += m.unique_opens ?? 0;
            acc.clicks += m.unique_clicks ?? 0;
            acc.bounces += (m.bounces ?? 0) + (m.bounce_drops ?? 0);
            acc.spam += (m.spam_reports ?? 0) + (m.spam_report_drops ?? 0);
            return acc;
          },
          { sent: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, spam: 0 },
        );
        stats = totals;
      }
    } catch {
      stats = null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Email Marketing', href: '/admin/email-marketing' },
            { label: 'SendGrid Settings' },
          ]}
        />
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">SendGrid Settings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your SendGrid integration — test sends, domain authentication, API key, and delivery stats.
          </p>
        </div>
        <SendGridSettingsClient
          config={{ fromEmail, replyTo, apiKeyConfigured, domainVerified }}
          stats={stats}
        />
      </div>
    </div>
  );
}
