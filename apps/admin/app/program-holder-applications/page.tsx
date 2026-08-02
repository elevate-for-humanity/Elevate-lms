import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import ProgramHolderApplicationActions from './ProgramHolderApplicationActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Applications | Elevate For Humanity',
  description: 'Review and process program holder applications.',
};

function statusClass(status: string) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800';
  if (status === 'approved' || status === 'approved_pending_user') return 'bg-green-100 text-green-800';
  if (status === 'denied') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function ProgramHolderApplicationsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('program_holder_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Program Holder Applications</h1>
            <p className="text-slate-600 mt-1">Review and process program holder requests.</p>
          </div>
          <Link
            href="/program-holders"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Back to Program Holders
          </Link>
        </div>

        {applications && applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Organization</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app: any) => (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{app.organization_name || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{app.contact_name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">
                        {app.email || 'N/A'}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{app.phone || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(app.status)}`}>
                        {app.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(app.created_at)}</td>
                    <td className="py-3 px-4">
                      <ProgramHolderApplicationActions
                        applicationId={app.id}
                        disabled={app.status !== 'pending'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No program holder applications found.
          </div>
        )}
      </div>
    </div>
  );
}
