import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Clock, XCircle, Eye, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Employer Onboarding Review | Admin',
};

export default async function EmployerOnboardingReview() {
  await requireRole(['admin', 'staff']);
  const auth = await createClient();

  const supabase = await requireAdminClient();

  let onboardings: any[] = [];
  let orientationProgress: any[] = [];
  if (supabase) {
    const [onboardingRes, orientationRes] = await Promise.all([
      supabase.from('employer_onboarding').select('*').order('created_at', { ascending: false }),
      // employer_onboarding_progress — written by /onboarding/employer/orientation
      supabase
        .from('employer_onboarding_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    onboardings = onboardingRes.data || [];
    orientationProgress = orientationRes.data || [];
  }

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-brand-blue-100 text-brand-blue-800',
    approved: 'bg-brand-green-100 text-brand-green-800',
    rejected: 'bg-brand-red-100 text-brand-red-800',
  };

  const statusIcons: Record<string, any> = {
    submitted: Clock,
    reviewed: Eye,
    approved: CheckCircle,
    rejected: XCircle,
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Onboarding' }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Employer Onboarding Review</h1>
          <p className="text-black">Review and approve employer applications</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Business Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">Submitted</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {onboardings?.map((onboarding) => {
                  const StatusIcon = statusIcons[onboarding.status] || Clock;
                  return (
                    <tr key={onboarding.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-black">
                        {onboarding.business_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">{onboarding.contact_name}</td>
                      <td className="px-6 py-4 text-sm text-black">{onboarding.contact_email}</td>
                      <td className="px-6 py-4 text-sm text-black">{onboarding.contact_phone}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold ${
                            statusColors[onboarding.status] || 'bg-slate-100 text-black'
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {onboarding.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {new Date(onboarding.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/employers/onboarding/${onboarding.id}`}
                          className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!onboardings || onboardings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black">No employer onboarding submissions yet</p>
            </div>
          ) : null}
        </div>

        {/* Employer Orientation Progress */}
        {orientationProgress.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mt-8">
            <h2 className="text-xl font-bold text-black mb-4">Employer Orientation Progress</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Employer ID', 'Step', 'Status', 'Completed At'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orientationProgress.map((row: any) => (
                    <tr key={row.id ?? row.employer_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {(row.employer_id ?? row.user_id ?? '—').slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-slate-700 capitalize">
                        {(row.step ?? row.current_step ?? '—').replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            row.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : row.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {row.status ?? 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
