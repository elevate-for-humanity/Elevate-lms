import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TeamsIntegrationClient from './TeamsIntegrationClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Microsoft Teams | Integrations | Admin',
};

export default async function TeamsIntegrationPage() {
  await requireRole(['admin', 'super_admin']);

  const webhookUrl = process.env.TEAMS_WEBHOOK_URL ?? '';
  const isConfigured = !!webhookUrl;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Integrations', href: '/admin/integrations' },
            { label: 'Microsoft Teams' },
          ]}
        />

        <div className="mt-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
              <rect width="48" height="48" rx="8" fill="#5059C9" />
              <path d="M28 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="white" />
              <path d="M20 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="white" opacity=".8" />
              <path d="M30 20h-4a6 6 0 0 1 6 6v8h4v-8a6 6 0 0 0-6-6z" fill="white" />
              <path
                d="M14 22h12a2 2 0 0 1 2 2v8a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-8a2 2 0 0 1 2-2z"
                fill="white"
                opacity=".9"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Microsoft Teams</h1>
            <p className="text-slate-500 text-sm">Webhook notifications for key platform events</p>
          </div>
        </div>

        <TeamsIntegrationClient isConfigured={isConfigured} webhookConfigured={isConfigured} />
      </div>
    </div>
  );
}
