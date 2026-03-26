import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Reports | Partner Portal | Elevate For Humanity',
  description: 'View partnership reports and analytics.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PartnerReportsPage() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/partner/reports');

  // Partner role guard — only partner, admin, super_admin, staff
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['partner', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Resolve partner org from partner_users
  const { data: partnerUser } = await supabase
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .single();

  const orgId = partnerUser?.partner_id;

  // Stats scoped to this partner org
  const now = new Date();
  const thisQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  let totalEnrollments = 0;
  let thisQuarterEnrollments = 0;
  let completedEnrollments = 0;
  let recentCompletions: any[] = [];

  if (orgId) {
    const [total, quarter, completed, recent] = await Promise.all([
      supabase.from('partner_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', orgId),
      supabase.from('partner_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', orgId)
        .gte('created_at', thisQuarterStart.toISOString()),
      supabase.from('partner_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', orgId)
        .eq('status', 'completed'),
      supabase.from('partner_enrollments')
        .select('id, completed_at, student_id, program_slug')
        .eq('partner_id', orgId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5),
    ]);

    totalEnrollments = total.count || 0;
    thisQuarterEnrollments = quarter.count || 0;
    completedEnrollments = completed.count || 0;
    recentCompletions = recent.data || [];

    // Enrich with student names
    if (recentCompletions.length > 0) {
      const studentIds = recentCompletions.map((r: any) => r.student_id).filter(Boolean);
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds);
        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name]));
        recentCompletions = recentCompletions.map((r: any) => ({
          ...r,
          student_name: profileMap[r.student_id] || 'Unknown',
        }));
      }
    }
  }

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentQuarter = Math.floor(now.getMonth() / 3);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-12.jpg" alt="Partner reports" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner-portal' }, { label: 'Reports' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partnership Reports</h1>
            <p className="text-gray-600">Performance metrics and analytics</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalEnrollments}</p>
            <p className="text-gray-600 text-sm">Total Enrollments</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-brand-green-500 mb-2" />
            <p className="text-2xl font-bold">{thisQuarterEnrollments}</p>
            <p className="text-gray-600 text-sm">This Quarter</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Calendar className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{completedEnrollments}</p>
            <p className="text-gray-600 text-sm">Completions</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quarterly Performance */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-blue-600" /> Quarterly Performance
            </h2>
            <div className="space-y-4">
              {quarters.map((q, idx) => {
                const isCurrentQ = idx === currentQuarter;
                const value = isCurrentQ ? thisQuarterEnrollments : 0;
                const pct = totalEnrollments > 0 ? Math.round((value / totalEnrollments) * 100) : 0;
                return (
                  <div key={q} className="flex items-center gap-4">
                    <span className="w-8 text-sm font-medium text-gray-500">{q}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-brand-blue-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Completions */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Recent Completions</h2>
            {recentCompletions.length > 0 ? (
              <div className="space-y-3">
                {recentCompletions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{c.student_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.program_slug?.replace(/-/g, ' ') || '—'}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">No completions yet</p>
            )}
          </div>
        </div>

        {/* Report Downloads */}
        <div className="mt-6 bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Available Reports</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Enrollment Summary', desc: 'All apprentice enrollments', period: 'Year to Date' },
              { name: 'Completion Report', desc: 'Completed apprenticeships', period: 'Last 12 Months' },
              { name: 'Hours Summary', desc: 'Training hours logged', period: 'Current Quarter' },
            ].map(report => (
              <div key={report.name} className="border rounded-lg p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <FileText className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-gray-500">{report.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{report.period}</p>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded">
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
