import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Briefcase, FileText, BarChart3, ArrowRight,
  Building2, CheckCircle, Clock, TrendingUp, PlusCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | Employer Portal',
  description: 'Manage apprentices, track training progress, and access employer tools.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function EmployerPortalDashboard() {
  const supabase = await createClient();
  if (!supabase) redirect('/login?redirect=/employer-portal');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employer-portal');

  const db = createAdminClient() || supabase;

  // Fetch employer profile
  const { data: profile } = await db.from('profiles').select('full_name, role').eq('id', user.id).single();
  const { data: employer } = await db.from('employer_profiles').select('*').eq('user_id', user.id).single();

  // Stats
  const [jobPostings, applications, placements, interviews] = await Promise.all([
    db.from('job_postings').select('id', { count: 'exact', head: true }).eq('employer_id', user.id),
    db.from('job_applications').select('id', { count: 'exact', head: true }),
    db.from('job_placements').select('id', { count: 'exact', head: true }),
    db.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'interview'),
  ]);

  const stats = [
    { label: 'Active Postings', value: jobPostings.count ?? 0, icon: Briefcase, color: 'text-brand-blue-600 bg-brand-blue-50' },
    { label: 'Applications', value: applications.count ?? 0, icon: FileText, color: 'text-amber-600 bg-amber-50' },
    { label: 'Interviews', value: interviews.count ?? 0, icon: Clock, color: 'text-purple-600 bg-purple-50' },
    { label: 'Placements', value: placements.count ?? 0, icon: CheckCircle, color: 'text-brand-green-600 bg-brand-green-50' },
  ];

  // Recent applications
  const { data: recentApps } = await db
    .from('job_applications')
    .select('id, status, applied_at, notes')
    .order('applied_at', { ascending: false })
    .limit(5);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {employer?.company_name || profile?.full_name || user.email}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/employer-portal/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition text-sm font-medium">
            <PlusCircle className="w-4 h-4" /> Post a Job
          </Link>
          <Link href="/employer-portal/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-gray-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Post a Job', href: '/employer-portal/jobs/new', icon: PlusCircle, desc: 'Create a new job posting', color: 'border-l-brand-blue-500' },
          { title: 'View Candidates', href: '/employer-portal/candidates', icon: Users, desc: 'Browse qualified candidates', color: 'border-l-brand-green-500' },
          { title: 'Company Profile', href: '/employer-portal/company', icon: Building2, desc: 'Update company information', color: 'border-l-amber-500' },
          { title: 'WOTC Credits', href: '/employer-portal/wotc', icon: TrendingUp, desc: 'Work Opportunity Tax Credits', color: 'border-l-purple-500' },
        ].map((a) => (
          <Link key={a.title} href={a.href}
            className={`bg-white rounded-xl border border-l-4 ${a.color} p-5 hover:shadow-md transition`}>
            <a.icon className="w-6 h-6 text-gray-700 mb-3" />
            <h3 className="font-bold mb-1">{a.title}</h3>
            <p className="text-gray-500 text-sm">{a.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Applications</h2>
          <Link href="/employer-portal/applications" className="text-brand-blue-600 text-sm font-medium hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {(recentApps && recentApps.length > 0) ? (
          <div className="space-y-3">
            {recentApps.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.notes?.split('\n')[0] || 'Application'}</p>
                  <p className="text-xs text-gray-500">
                    {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  app.status === 'submitted' ? 'bg-brand-blue-100 text-brand-blue-700' :
                  app.status === 'interview' ? 'bg-purple-100 text-purple-700' :
                  app.status === 'hired' ? 'bg-brand-green-100 text-brand-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {(app.status || 'pending').replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">No applications yet.</p>
            <Link href="/employer-portal/jobs/new" className="text-brand-blue-600 text-sm font-medium hover:underline inline-flex items-center gap-1">
              Post your first job <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
