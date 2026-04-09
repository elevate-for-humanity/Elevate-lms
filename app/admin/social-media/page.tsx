import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { getAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Social Media | Admin | Elevate For Humanity',
};

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  paused:    'bg-yellow-100 text-yellow-800',
  draft:     'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
  failed:    'bg-red-100 text-red-800',
};

export default async function SocialMediaPage() {
  await requireAdmin();
  const db = await getAdminClient();

  const { data: campaigns } = await db
    .from('social_campaigns')
    .select('*')
    .order('updated_at', { ascending: false });

  const rows = campaigns ?? [];
  const active = rows.filter((r: any) => r.status === 'active').length;
  const totalPublished = rows.reduce((sum: number, r: any) => sum + (r.published_posts ?? 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Social Media' }]} />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Social Media Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">Live campaign records from the database</p>
          </div>
          <Link href="/admin/social-media/campaigns/new"
            className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + New Campaign
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Campaigns',  value: rows.length },
            { label: 'Active',           value: active },
            { label: 'Posts Published',  value: totalPublished.toLocaleString() },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800">Campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Campaign', 'Platform', 'Status', 'Scheduled', 'Published', 'Failed', 'Last Published'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{r.platform}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.scheduled_posts}</td>
                    <td className="px-4 py-3 text-slate-600">{r.published_posts}</td>
                    <td className="px-4 py-3 text-slate-600">{r.failed_posts}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.last_published_at ? new Date(r.last_published_at).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No campaigns yet. Create your first campaign to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
