import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, CheckCircle, Briefcase, FileText, User, ArrowRight, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Job Ready Indy | Elevate For Humanity',
  description: 'Manage Job Ready Indy participants and outcomes.',
};

export default async function JRIPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/jri');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const [
    { count: totalParticipants },
    { count: activeParticipants },
    { count: completedParticipants },
    { count: placedParticipants },
    { data: recentParticipants },
    { data: programBreakdown },
  ] = await Promise.all([
    supabase.from('jri_participants').select('id', { count: 'exact', head: true }),
    supabase.from('jri_participants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('jri_participants').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('jri_participants').select('id', { count: 'exact', head: true }).eq('employment_status', 'employed'),
    supabase.from('jri_participants').select('id, status, program, enrolled_at, employment_status, profiles(full_name, email)').order('enrolled_at', { ascending: false }).limit(12),
    supabase.from('jri_participants').select('program, status').limit(500),
  ]);

  const byProgram: Record<string, number> = {};
  for (const p of (programBreakdown || [])) {
    const prog = (p as any).program || 'Unassigned';
    byProgram[prog] = (byProgram[prog] || 0) + 1;
  }

  const placementRate = (totalParticipants || 0) > 0
    ? Math.round(((placedParticipants || 0) / (totalParticipants || 1)) * 100) : 0;

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-brand-blue-100 text-brand-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    withdrawn: 'bg-red-100 text-red-700',
    employed: 'bg-green-100 text-green-700',
    unemployed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Job Ready Indy' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Ready Indy</h1>
              <p className="text-gray-600 mt-1">Job Ready Indy — Indianapolis Workforce Initiative</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/jri/reports" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
                Reports
              </Link>
              <Link href="/admin/jri/participants/new" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
                Add Participant
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalParticipants || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Participants</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeParticipants || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-brand-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedParticipants || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Completed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{placedParticipants || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Employed</p>
            <p className="text-xs text-gray-400 mt-0.5">{placementRate}% placement rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Participants by Program</h2>
            {Object.keys(byProgram).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(byProgram).sort(([, a], [, b]) => b - a).map(([prog, count]) => {
                  const pct = (totalParticipants || 0) > 0 ? Math.round((count / (totalParticipants || 1)) * 100) : 0;
                  return (
                    <div key={prog}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate max-w-[160px]">{prog}</span>
                        <span className="font-medium text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-brand-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No program data yet</p>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Recent Participants</h2>
              <Link href="/admin/jri/participants" className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Participant</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employment</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentParticipants && recentParticipants.length > 0 ? recentParticipants.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-brand-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{(p.profiles as any)?.full_name || 'Participant'}</p>
                            <p className="text-xs text-gray-500">{(p.profiles as any)?.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.program || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[p.employment_status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.employment_status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No Job Ready Indy participants yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/admin/jri/participants', icon: Users, label: 'All Participants', desc: 'View and manage all Job Ready Indy participants' },
            { href: '/admin/jri/reports', icon: FileText, label: 'Compliance Reports', desc: 'Generate Job Ready Indy compliance reports' },
            { href: '/admin/funding', icon: Briefcase, label: 'Funding Tracking', desc: 'Job Ready Indy funding allocations and disbursements' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
