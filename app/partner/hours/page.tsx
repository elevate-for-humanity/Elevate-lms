import Image from 'next/image';
import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, XCircle, AlertCircle, TrendingUp, Briefcase, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getUnverifiedHours, type OJTHoursLog } from '@/lib/blended-learning/ojt-tracking';

export const metadata: Metadata = {
  title: 'Hours Management | Partner Portal',
  description: 'Review and approve apprentice hours.',
};

export const dynamic = 'force-dynamic';

export default async function PartnerHoursPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partner/hours');
  }

  // Get partner info
  const { data: partnerUser } = await db
    .from('partner_users')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single();

  if (!partnerUser) {
    redirect('/partner');
  }

  // Get hours statistics
  const { data: pendingHours, count: pendingCount } = await db
    .from('training_hours')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const { count: approvedCount } = await db
    .from('training_hours')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: rejectedCount } = await db
    .from('training_hours')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  // Get total hours approved this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyHours } = await db
    .from('training_hours')
    .select('hours')
    .eq('status', 'approved')
    .gte('approved_at', startOfMonth.toISOString());

  const totalMonthlyHours = monthlyHours?.reduce((sum, h) => sum + (h.hours || 0), 0) || 0;

  // OJT placements and unverified hours
  let ojtPlacements: any[] = [];
  let unverifiedOJT: OJTHoursLog[] = [];
  try {
    const { data: placements } = await db
      .from('ojt_placements')
      .select('id, student_id, employer_name, position_title, status, total_hours_required, total_hours_completed')
      .eq('status', 'active')
      .limit(10);
    ojtPlacements = placements || [];

    unverifiedOJT = await getUnverifiedHours(user.email || '');
  } catch {
    // OJT tables may not exist
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/employer-hero.jpg" alt="Training hours" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Partner', href: '/partner' },
            { label: 'Hours' }
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hours Management</h1>
            <p className="text-gray-600 mt-1">Review and approve apprentice training hours</p>
          </div>
          <Link
            href="/partner/hours/pending"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600"
          >
            <AlertCircle className="w-4 h-4" />
            Review Pending ({pendingCount || 0})
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount || 0}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount || 0}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-brand-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount || 0}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalMonthlyHours.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Hours This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/partner/hours/pending" className="block">
            <div className="bg-white rounded-xl border p-6 hover:border-brand-orange-300 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-brand-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Review Pending Hours</h3>
                  <p className="text-sm text-gray-600">Approve or reject submitted hours</p>
                </div>
              </div>
              {(pendingCount || 0) > 0 && (
                <div className="mt-4 p-3 bg-brand-orange-50 rounded-lg">
                  <p className="text-sm text-brand-orange-800">
                    <strong>{pendingCount}</strong> hours entries awaiting your review
                  </p>
                </div>
              )}
            </div>
          </Link>

          <Link href="/partner/attendance" className="block">
            <div className="bg-white rounded-xl border p-6 hover:border-brand-blue-300 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Record Attendance</h3>
                  <p className="text-sm text-gray-600">Log attendance for training sessions</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* OJT Placements */}
        {ojtPlacements.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> On-the-Job Training Placements
            </h2>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Progress</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ojtPlacements.map((p: any) => {
                    const pct = p.total_hours_required > 0
                      ? Math.round((p.total_hours_completed / p.total_hours_required) * 100)
                      : 0;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{p.student_id?.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{p.employer_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{p.position_title}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{p.total_hours_completed}/{p.total_hours_required}h</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            p.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' :
                            p.status === 'completed' ? 'bg-brand-blue-100 text-brand-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{p.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unverified OJT Hours */}
        {unverifiedOJT.length > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Unverified OJT Hours</h3>
                <p className="text-amber-700 text-sm mt-1">
                  {unverifiedOJT.length} OJT hour{unverifiedOJT.length > 1 ? ' entries' : ' entry'} awaiting supervisor verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
