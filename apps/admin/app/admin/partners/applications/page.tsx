import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import PartnerApplicationActions from './PartnerApplicationActions';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/partners/applications',
  },
  title: 'Partner Applications | Elevate For Humanity',
  description: 'Review and process partner applications.',
};

function statusClass(status: string) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800';
  if (status === 'approved' || status === 'approved_pending_user') return 'bg-green-100 text-green-800';
  if (status === 'denied') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

export default async function PartnerApplicationsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('partner_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Partner Applications</h1>
            <p className="text-slate-600 mt-1">Review, approve, or deny incoming partner requests.</p>
          </div>
          <Link
            href="/admin/partners"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Back to Partners
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Shop</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Owner</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Programs</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Submitted</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(applications || []).map((app: any) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{app.shop_name}</p>
                    <p className="text-xs text-slate-500">{app.city}, {app.state}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{app.owner_name}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{app.contact_email}</p>
                    <p className="text-xs text-slate-500">{app.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {Array.isArray(app.programs_requested)
                      ? app.programs_requested.join(', ')
                      : 'Not provided'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/partners/applications/${app.id}`}
                        className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700">
                        View / Edit
                      </Link>
                      {app.status === 'pending' && (
                        <PartnerApplicationActions applicationId={app.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!applications || applications.length === 0) && (
            <div className="p-8 text-center text-slate-500">No partner applications found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
