import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Reports | Partner Portal | Elevate For Humanity',
  description: 'View partnership reports and analytics.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PartnerReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partner/reports');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['delegate', 'program_holder', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Get partner's program holder record
  const { data: programHolder } = await db
    .from('program_holders')
    .select('id, name, payout_share')
    .eq('owner_id', user.id)
    .single();

  const partnerId = programHolder?.id || user.id;
  const partnerField = programHolder ? 'program_holder_id' : 'delegate_id';

  // Get date ranges
  const now = new Date();
  const thisQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const lastQuarterStart = new Date(thisQuarterStart);
  lastQuarterStart.setMonth(lastQuarterStart.getMonth() - 3);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  // Fetch enrollment stats
  const { count: totalEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq(partnerField, partnerId);

  const { count: thisQuarterEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq(partnerField, partnerId)
    .gte('enrolled_at', thisQuarterStart.toISOString());

  const { count: completedEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq(partnerField, partnerId)
    .eq('status', 'completed');

  // Fetch recent completions
  const { data: recentCompletions } = await db
    .from('program_enrollments')
    .select(`
      id,
      completed_at,
      student:profiles!enrollments_student_id_fkey(full_name),
      program:programs(name)
    `)
    .eq(partnerField, partnerId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  // Calculate estimated payout (simplified)
  const payoutShare = programHolder?.payout_share || 0;
  const estimatedPayout = (completedEnrollments || 0) * 500 * (payoutShare / 100);

  // Quarterly data for chart
  const quarters = [
    { name: 'Q1', enrollments: 0, completions: 0 },
    { name: 'Q2', enrollments: 0, completions: 0 },
    { name: 'Q3', enrollments: 0, completions: 0 },
    { name: 'Q4', enrollments: 0, completions: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Reports' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partnership Reports</h1>
            <p className="text-gray-600">Performance metrics and analytics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalEnrollments || 0}</p>
            <p className="text-gray-600 text-sm">Total Referrals</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-brand-green-500 mb-2" />
            <p className="text-2xl font-bold">{thisQuarterEnrollments || 0}</p>
            <p className="text-gray-600 text-sm">This Quarter</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Calendar className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{completedEnrollments || 0}</p>
            <p className="text-gray-600 text-sm">Completions</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <DollarSign className="w-8 h-8 text-brand-orange-500 mb-2" />
            <p className="text-2xl font-bold">${estimatedPayout.toLocaleString()}</p>
            <p className="text-gray-600 text-sm">Est. Payout ({payoutShare}%)</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quarterly Performance */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Quarterly Performance</h2>
            <div className="space-y-4">
              {quarters.map((q, idx) => (
                <div key={q.name} className="flex items-center gap-4">
                  <span className="w-8 text-sm font-medium text-gray-500">{q.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-brand-orange-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, (idx + 1) * 20)}%` }} />
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {idx === Math.floor(now.getMonth() / 3) ? thisQuarterEnrollments : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Completions */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Recent Completions</h2>
            {recentCompletions && recentCompletions.length > 0 ? (
              <div className="space-y-3">
                {recentCompletions.map((completion: any) => (
                  <div key={completion.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{completion.student?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{completion.program?.name}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {completion.completed_at ? new Date(completion.completed_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No completions yet</p>
            )}
          </div>
        </div>

        {/* Report Downloads */}
        <div className="mt-6 bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Available Reports</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Enrollment Summary', desc: 'All student enrollments', period: 'Year to Date' },
              { name: 'Completion Report', desc: 'Completed programs', period: 'Last 12 Months' },
              { name: 'Financial Summary', desc: 'Payout calculations', period: 'Current Quarter' },
            ].map(report => (
              <div key={report.name} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <FileText className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-500">{report.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{report.period}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Download className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
