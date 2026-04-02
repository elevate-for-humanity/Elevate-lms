import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { getSiteHealthSnapshot } from '@/lib/admin/get-site-health';
import type { HealthStatus } from '@/lib/admin/get-site-health';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Site Health | Elevate For Humanity',
};

function statusBadge(status: HealthStatus) {
  if (status === 'healthy')  return 'bg-green-100 text-green-800';
  if (status === 'degraded') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function statusDot(status: HealthStatus) {
  if (status === 'healthy')  return 'bg-green-500';
  if (status === 'degraded') return 'bg-yellow-500';
  return 'bg-red-500';
}

function overallBanner(status: HealthStatus) {
  if (status === 'healthy')
    return { bg: 'bg-green-50 border-green-200', text: 'text-green-800', label: 'All Systems Operational' };
  if (status === 'degraded')
    return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', label: 'Partial Degradation' };
  return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', label: 'Service Disruption' };
}

export default async function SiteHealthPage() {
  await requireAdmin();
  const health = await getSiteHealthSnapshot();
  const banner = overallBanner(health.overallStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Site Health' }]} />
        <div className="mt-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Site Health</h1>
          <p className="text-gray-500 text-sm mt-1">
            Live checks — last run {new Date(health.checkedAt).toLocaleString()}
          </p>
        </div>
        <div className={`border rounded-lg p-4 mb-6 flex items-center gap-3 ${banner.bg}`}>
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${statusDot(health.overallStatus)}`} />
          <p className={`font-semibold ${banner.text}`}>{banner.label}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800">Service Status</h2>
          </div>
          <div className="divide-y">
            {health.services.map((svc) => (
              <div key={svc.name} className="px-4 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot(svc.status)}`} />
                  <span className="font-medium text-slate-900">{svc.name}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm text-slate-500 hidden sm:block">{svc.detail}</span>
                  {svc.latencyMs !== null && (
                    <span className="text-sm text-slate-400">{svc.latencyMs} ms</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(svc.status)}`}>
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
