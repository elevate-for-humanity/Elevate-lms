import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import {
  Wrench, Database, Upload, Download, Key, Activity,
  RefreshCw, Layers, Terminal, Shield, Clock, Webhook,
  FileSearch, AlertTriangle, Settings, ShoppingBag,
  HeadphonesIcon, Users, Bot,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Advanced Tools | Admin',
  description: 'System tools — migrations, imports, exports, API keys, queues, and developer utilities.',
};

const TOOL_SECTIONS = [
  {
    title: 'Data & Migrations',
    icon: Database,
    iconBg: 'bg-slate-700',
    description: 'Database migrations, imports, and exports.',
    tools: [
      { label: 'Migrations', href: '/admin/migrations', desc: 'Run and track database migrations' },
      { label: 'Data Import', href: '/admin/data-import', desc: 'Bulk import students, programs, or records' },
      { label: 'Course Import', href: '/admin/course-import', desc: 'Import course content from external sources' },
      { label: 'Import', href: '/admin/import', desc: 'General import utility' },
      { label: 'Hours Export', href: '/admin/hours-export', desc: 'Export participant hours for reporting' },
    ],
  },
  {
    title: 'System Health & Monitoring',
    icon: Activity,
    iconBg: 'bg-blue-600',
    description: 'Monitor system status, health checks, and performance.',
    tools: [
      { label: 'Monitoring Dashboard', href: '/admin/monitoring', desc: 'System health, uptime, and support bundle' },
      { label: 'System Health', href: '/admin/system-health', desc: 'Database, Redis, and service status' },
      { label: 'Monitoring Setup', href: '/admin/monitoring/setup', desc: 'Configure alerts and thresholds' },
      { label: 'Activity Feed', href: '/admin/activity', desc: 'Real-time event log across all systems' },
      { label: 'Audit Logs', href: '/admin/audit-logs', desc: 'Full audit trail of all admin actions' },
      { label: 'Compliance Audit', href: '/admin/compliance-audit', desc: 'Compliance event log and reporting' },
    ],
  },
  {
    title: 'Queues & Jobs',
    icon: Clock,
    iconBg: 'bg-amber-600',
    description: 'Background job queues and scheduled tasks.',
    tools: [
      { label: 'Enrollment Jobs', href: '/admin/enrollment-jobs', desc: 'Enrollment processing queue' },
      { label: 'Payout Queue', href: '/admin/payout-queue', desc: 'Pending payouts and disbursements' },
      { label: 'Review Queue', href: '/admin/review-queue', desc: 'Items pending admin review' },
      { label: 'WorkOne Queue', href: '/admin/workone-queue', desc: 'WorkOne referral processing queue' },
      { label: 'Workforce Referrals', href: '/admin/referrals', desc: 'Agency workforce referral submissions' },
      { label: 'Booth Rental Applications', href: '/admin/shops', desc: 'Booth/suite rental signups and billing' },
      { label: 'System Jobs', href: '/admin/system/jobs', desc: 'Scheduled background jobs' },
      { label: 'System Webhooks', href: '/admin/system/webhooks', desc: 'Webhook delivery logs and retries' },
    ],
  },
  {
    title: 'Support & Tutorials',
    icon: HeadphonesIcon,
    iconBg: 'bg-teal-600',
    description: 'Support tickets, calendar, and tutorial content.',
    tools: [
      { label: 'Support Tickets', href: '/admin/submissions', desc: 'View and respond to support ticket submissions' },
      { label: 'Calendar Events', href: '/admin/automation', desc: 'Manage calendar_events — orientations, sessions, deadlines' },
      { label: 'Tutorials', href: '/admin/docs', desc: 'Platform tutorial content management' },
      { label: 'Suboffice Applications', href: '/admin/provider-applications', desc: 'Suboffice/satellite location applications' },
    ],
  },
  {
    title: 'Store & App Subscriptions',
    icon: ShoppingBag,
    iconBg: 'bg-indigo-600',
    description: 'App trial management, upgrades, and store configuration.',
    tools: [
      { label: 'Store', href: '/admin/store', desc: 'App store listings and pricing' },
      { label: 'App Trials', href: '/admin/store', desc: 'Start or check trial status for sam-gov, grants, website-builder' },
      { label: 'Licenses', href: '/admin/licenses', desc: 'License assignments and expirations' },
      { label: 'License Requests', href: '/admin/license-requests', desc: 'Pending license upgrade requests' },
      { label: 'Promo Codes', href: '/admin/promo-codes', desc: 'Discount and promo code management' },
      { label: 'Commercialization Checklist', href: '/admin/docs', desc: 'MVP gate, hardening gate, pricing tiers, and 10-minute buyer demo plan' },
      { label: 'Admin Remediation TODO', href: '/admin/docs', desc: 'Priority-ordered execution list for reliability, prefill completion, and commercialization hardening' },
      { label: 'DevStudio Dispatch Checklist', href: '/admin/docs', desc: 'Verify GitHub Actions dispatch for build/deploy/test commands' },
    ],
  },
  {
    title: 'API & Integrations',
    icon: Key,
    iconBg: 'bg-purple-600',
    description: 'API keys, webhooks, and third-party integrations.',
    tools: [
      { label: 'API Keys', href: '/admin/api-keys', desc: 'Manage API keys and access tokens' },
      { label: 'Integrations', href: '/admin/integrations', desc: 'Third-party service integrations' },
      { label: 'Webhooks', href: '/admin/system/webhooks', desc: 'Webhook configuration and logs' },
    ],
  },
  {
    title: 'Developer Tools',
    icon: Terminal,
    iconBg: 'bg-emerald-700',
    description: 'Developer utilities, debugging, and studio tools.',
    tools: [
      { label: 'Operations Hub', href: '/admin/operations', desc: 'Cron jobs, workflows, dead letters, and admin alerts' },
      { label: 'Dev Studio', href: '/admin/studio', desc: 'Container, deploy, secrets, terminal, and live preview' },
      { label: 'Automation', href: '/admin/automation', desc: 'Workflow automation rules' },
      { label: 'Workflows', href: '/admin/workflows', desc: 'Automated workflow definitions' },
      { label: 'Studio', href: '/admin/studio', desc: 'Course Studio — builder, curriculum, video, and AI copilot' },
      { label: 'HVAC AI Instructor', href: '/admin/integrations/gemini', desc: 'Marcus Johnson — Gemini-powered HVAC lesson instructor' },
      { label: 'Sentry Test', href: '/api/sentry-test', desc: 'Dev only — trigger a test error to verify Sentry capture' },
    ],
  },
  {
    title: 'Security & Compliance',
    icon: Shield,
    iconBg: 'bg-red-600',
    description: 'Security settings, compliance tools, and governance.',
    tools: [
      { label: 'Governance', href: '/admin/governance', desc: 'Governance policies and controls' },
      { label: 'Governance — Security', href: '/admin/governance/security', desc: 'Security policy configuration' },
      { label: 'FERPA', href: '/admin/ferpa', desc: 'FERPA compliance management' },
      { label: 'Compliance', href: '/admin/compliance', desc: 'Compliance checklist and status' },
    ],
  },
];

export default async function AdvancedToolsPage() {
  await requireRole(['admin', 'super_admin']);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Advanced Tools' }]} />
        <div className="flex items-center gap-3 mt-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Advanced Tools</h1>
            <p className="text-sm text-slate-500">System utilities — admin and super_admin only</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            These tools affect live data and system configuration. All actions are logged in the audit trail.
            Use with care — changes cannot always be undone.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {TOOL_SECTIONS.map(({ title, icon: Icon, iconBg, description, tools }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
              {tools.map(({ label, href, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="bg-white px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Quick links footer */}
        <div className="bg-slate-800 rounded-xl px-6 py-5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Settings className="w-4 h-4" />
            <span className="font-semibold text-sm">Quick Access</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Operations', href: '/admin/operations' },
              { label: 'Settings', href: '/admin/settings' },
              { label: 'Users', href: '/admin/students' },
              { label: 'Licenses', href: '/admin/licenses' },
              { label: 'Tenants', href: '/admin/tenants' },
              { label: 'Monitoring', href: '/admin/monitoring' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
