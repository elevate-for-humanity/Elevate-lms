import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Briefcase, Award, TrendingUp, Heart, BookOpen, Star, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Impact Dashboard | Elevate For Humanity',
  description: 'Track program impact and community outcomes.',
};

export default async function ImpactPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



  const [
    { count: totalEnrolled },
    { count: totalCertificates },
    { count: totalPrograms },
    { count: totalCourses },
    { data: employmentData },
    { data: recentCerts },
    { data: programBreakdown },
    { data: donationsData },
  ] = await Promise.all([
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    supabase.from('programs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('employment_outcomes').select('employment_status, wage_at_placement, wage_at_followup').limit(500),
    supabase.from('certificates').select('id, user_id, issued_at, profiles(full_name)').order('issued_at', { ascending: false }).limit(10),
    supabase.from('programs').select('id, title, status').eq('status', 'active').limit(20),
    supabase.from('donations').select('amount, created_at').limit(500),
  ]);

  const employed = (employmentData || []).filter((e: any) => e.employment_status === 'employed').length;
  const employmentRate = employmentData && employmentData.length > 0
    ? Math.round((employed / employmentData.length) * 100) : 0;

  const wageGains = (employmentData || [])
    .filter((e: any) => e.wage_at_placement && e.wage_at_followup)
    .map((e: any) => Number(e.wage_at_followup) - Number(e.wage_at_placement));
  const avgWageGain = wageGains.length > 0
    ? (wageGains.reduce((a: number, b: number) => a + b, 0) / wageGains.length).toFixed(2) : '0.00';

  const totalDonations = (donationsData || []).reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  const stats = [
    { label: 'Total Enrolled', value: (totalEnrolled || 0).toLocaleString(), icon: Users, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { label: 'Credentials Issued', value: (totalCertificates || 0).toLocaleString(), icon: Award, color: 'text-brand-orange-600', bg: 'bg-brand-orange-50' },
    { label: 'Employment Rate', value: `${employmentRate}%`, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Avg Wage Gain', value: `$${avgWageGain}/hr`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Programs', value: (totalPrograms || 0).toLocaleString(), icon: BookOpen, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { label: 'Active Courses', value: (totalCourses || 0).toLocaleString(), icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Donations Received', value: `$${totalDonations.toLocaleString()}`, icon: Heart, color: 'text-brand-red-600', bg: 'bg-brand-red-50' },
    { label: 'Employment Records', value: (employmentData?.length || 0).toLocaleString(), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const statusColors: Record<string, string> = {
    employed: 'bg-green-100 text-green-700',
    unemployed: 'bg-red-100 text-red-700',
    training: 'bg-brand-blue-100 text-brand-blue-700',
    unknown: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Impact' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Impact Dashboard</h1>
              <p className="text-gray-600 mt-1">Live program impact and community outcomes</p>
            </div>
            <Link href="/admin/outcomes" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium">
              View Outcomes <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border p-5">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Credentials Issued</h2>
              <Link href="/admin/certificates" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">View all</Link>
            </div>
            <div className="divide-y">
              {recentCerts && recentCerts.length > 0 ? recentCerts.map((cert: any) => (
                <div key={cert.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-orange-100 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-brand-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{(cert.profiles as any)?.full_name || 'Student'}</p>
                      <p className="text-xs text-gray-500">{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Issued</span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No certificates issued yet</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Active Programs</h2>
              <Link href="/admin/programs" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Manage</Link>
            </div>
            <div className="divide-y">
              {programBreakdown && programBreakdown.length > 0 ? programBreakdown.map((prog: any) => (
                <div key={prog.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-brand-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{prog.title || prog.name}</p>
                  </div>
                  <span className="text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-1 rounded-full capitalize">{prog.status}</span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No active programs</div>
              )}
            </div>
          </div>
        </div>

        {employmentData && employmentData.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Employment Outcomes Breakdown</h2>
              <Link href="/admin/outcomes" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Full report</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['employed', 'unemployed', 'training', 'unknown'].map((status) => {
                const count = (employmentData || []).filter((e: any) => (e.employment_status || 'unknown') === status).length;
                const pct = employmentData.length > 0 ? Math.round((count / employmentData.length) * 100) : 0;
                return (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500 capitalize mt-1">{status}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${statusColors[status] || statusColors.unknown}`}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
