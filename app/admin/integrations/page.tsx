import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  Video, Calendar, MessageSquare, Mail, CreditCard, Database,
  GraduationCap, Shield, CheckCircle2, XCircle, AlertCircle,
  ExternalLink, Settings,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Integrations | Admin | Elevate For Humanity',
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/integrations' },
};

type IntegrationStatus = 'active' | 'configured' | 'not_configured';

interface Integration {
  name: string;
  slug: string;
  description: string;
  icon: typeof Video;
  category: 'communication' | 'scheduling' | 'payments' | 'data' | 'compliance' | 'learning';
  status: IntegrationStatus;
  envVars: string[];
  docsUrl?: string;
  configUrl?: string;
}

function getStatus(envVars: string[]): IntegrationStatus {
  const allSet = envVars.every((v) => !!process.env[v]);
  if (allSet && envVars.length > 0) return 'active';
  const someSet = envVars.some((v) => !!process.env[v]);
  if (someSet) return 'configured';
  return 'not_configured';
}

const INTEGRATIONS: Integration[] = [
  {
    name: 'Zoom',
    slug: 'zoom',
    description: 'Video meetings with cloud recording. Creates unique Zoom links for every consultation, orientation, and class session.',
    icon: Video,
    category: 'communication',
    envVars: ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'],
    status: 'not_configured',
    docsUrl: 'https://marketplace.zoom.us/develop/create',
  },
  {
    name: 'Calendly',
    slug: 'calendly',
    description: 'Appointment scheduling for advising, program consultations, tax prep, and workforce intake. Webhook auto-creates DB records.',
    icon: Calendar,
    category: 'scheduling',
    envVars: [],
    status: 'active',
    docsUrl: 'https://calendly.com/integrations',
  },
  {
    name: 'Google Calendar',
    slug: 'google-calendar',
    description: 'Sync course schedules and appointments to student and staff Google Calendars via OAuth.',
    icon: Calendar,
    category: 'scheduling',
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    status: 'not_configured',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  {
    name: 'Microsoft Teams',
    slug: 'teams',
    description: 'Incoming webhook notifications for enrollment alerts, application updates, and system events.',
    icon: MessageSquare,
    category: 'communication',
    envVars: ['TEAMS_WEBHOOK_URL'],
    status: 'not_configured',
  },
  {
    name: 'Resend (Email)',
    slug: 'resend',
    description: 'Transactional email for confirmations, approvals, notifications, and password resets.',
    icon: Mail,
    category: 'communication',
    envVars: ['RESEND_API_KEY'],
    status: 'not_configured',
    docsUrl: 'https://resend.com/api-keys',
  },
  {
    name: 'Stripe',
    slug: 'stripe',
    description: 'Payment processing for licensing, course purchases, and subscription billing.',
    icon: CreditCard,
    category: 'payments',
    envVars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    status: 'not_configured',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
  },
  {
    name: 'Supabase',
    slug: 'supabase',
    description: 'Database, auth, storage, and real-time subscriptions. Core platform infrastructure.',
    icon: Database,
    category: 'data',
    envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    status: 'not_configured',
  },
  {
    name: 'Google Classroom',
    slug: 'google-classroom',
    description: 'Sync courses, assignments, and grades with Google Classroom for blended learning.',
    icon: GraduationCap,
    category: 'learning',
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    status: 'not_configured',
    configUrl: '/admin/integrations/google-classroom',
  },
  {
    name: 'Salesforce',
    slug: 'salesforce',
    description: 'CRM sync for leads, enrollments, employer partnerships, and workforce board reporting.',
    icon: Database,
    category: 'data',
    envVars: ['SALESFORCE_CLIENT_ID', 'SALESFORCE_CLIENT_SECRET'],
    status: 'not_configured',
    docsUrl: 'https://login.salesforce.com',
    configUrl: '/admin/integrations/salesforce',
  },
  {
    name: 'Gemini AI',
    slug: 'gemini',
    description: 'AI tutor powered by Google Gemini 2.5 Flash. Provides Elevate-specific academic support.',
    icon: Shield,
    category: 'learning',
    envVars: ['GEMINI_API_KEY'],
    status: 'not_configured',
  },
];

const statusConfig: Record<IntegrationStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  active: { label: 'Active', color: 'bg-brand-green-100 text-brand-green-700', Icon: CheckCircle2 },
  configured: { label: 'Partial', color: 'bg-amber-100 text-amber-700', Icon: AlertCircle },
  not_configured: { label: 'Not Configured', color: 'bg-slate-100 text-slate-500', Icon: XCircle },
};

const categoryLabels: Record<string, string> = {
  communication: 'Communication',
  scheduling: 'Scheduling',
  payments: 'Payments',
  data: 'Data & CRM',
  compliance: 'Compliance',
  learning: 'Learning',
};

export default function AdminIntegrationsPage() {
  const integrations = INTEGRATIONS.map((i) => ({
    ...i,
    status: i.envVars.length > 0 ? getStatus(i.envVars) : i.status,
  }));

  const activeCount = integrations.filter((i) => i.status === 'active').length;
  const configuredCount = integrations.filter((i) => i.status === 'configured').length;

  const categories = Object.entries(
    integrations.reduce<Record<string, Integration[]>>((acc, i) => {
      (acc[i.category] ||= []).push(i);
      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Integrations' }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-slate-500 mb-1">Total Integrations</p>
            <p className="text-3xl font-bold text-slate-900">{integrations.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-slate-500 mb-1">Active</p>
            <p className="text-3xl font-bold text-brand-green-600">{activeCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-slate-500 mb-1">Needs Setup</p>
            <p className="text-3xl font-bold text-slate-400">{integrations.length - activeCount - configuredCount}</p>
          </div>
        </div>

        {/* Integration cards by category */}
        {categories.map(([category, items]) => (
          <section key={category} className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{categoryLabels[category] || category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((integration) => {
                const { label, color, Icon: StatusIcon } = statusConfig[integration.status];
                const IntIcon = integration.icon;
                return (
                  <div key={integration.slug} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <IntIcon className="w-5 h-5 text-slate-700" />
                        </div>
                        <h3 className="font-semibold text-lg text-slate-900">{integration.name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 flex-1">{integration.description}</p>
                    <div className="flex gap-2 mt-auto">
                      {integration.configUrl && (
                        <Link
                          href={integration.configUrl}
                          className="flex items-center gap-1 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700"
                        >
                          <Settings className="w-4 h-4" /> Configure
                        </Link>
                      )}
                      {integration.docsUrl && (
                        <a
                          href={integration.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 ml-auto"
                        >
                          <ExternalLink className="w-4 h-4" /> Docs
                        </a>
                      )}
                    </div>
                    {integration.status !== 'active' && integration.envVars.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Required env vars:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {integration.envVars.map((v) => (
                            <span key={v} className={`text-xs px-1.5 py-0.5 rounded font-mono ${process.env[v] ? 'bg-brand-green-50 text-brand-green-700' : 'bg-slate-100 text-slate-400'}`}>
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
