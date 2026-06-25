import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, CheckCircle, Briefcase, FileText, User, ArrowRight, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Job Ready Indy | Elevate For Humanity',
  description: 'Manage Job Ready Indy participants and outcomes.',
};

export default async function JRIPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  // JRI participants = program_enrollments where funding_source = 'jri'
  // Columns: user_id, full_name, email, program_id, status, enrolled_at
  const [totalRes, activeRes, completedRes, recentRes] = await Promise.all([
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('funding_source', 'jri'),
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('funding_source', 'jri')
      .eq('status', 'active'),
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('funding_source', 'jri')
      .eq('status', 'completed'),
    supabase
      .from('program_enrollments')
      .select('id, full_name, email, status, enrolled_at, program_id, programs(title)')
      .eq('funding_source', 'jri')
      .order('enrolled_at', { ascending: false })
      .limit(12),
  ]);

  if (totalRes.error)     console.error('[JRI] total:', totalRes.error.message);
  if (activeRes.error)    console.error('[JRI] active:', activeRes.error.message);
  if (completedRes.error) console.error('[JRI] completed:', completedRes.error.message);
  if (recentRes.error)    console.error('[JRI] recent:', recentRes.error.message);

  const totalParticipants     = totalRes.count ?? 0;
  const activeParticipants    = activeRes.count ?? 0;
  const completedParticipants = completedRes.count ?? 0;
  const pendingParticipants   = Math.max(0, totalParticipants - activeParticipants - completedParticipants);
  const recentParticipants    = recentRes.data ?? [];
  const completionRate        = totalParticipants > 0
    ? Math.round((completedParticipants / totalParticipants) * 100)
    : 0;

  const statusBadge: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    completed: 'bg-brand-blue-100 text-brand-blue-700',
    pending:   'bg-yellow-100 text-yellow-700',
    withdrawn: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Job Ready Indy' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Job Ready Indy</h1>
              <p className="text-slate-500 mt-1">Indianapolis Workforce Initiative — JRI-funded enrollments</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/jri/reports" className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm">
                Reports
              </Link>
              <Link href="/admin/jri/participants/new" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
                Add Participant
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,       color: 'bg-brand-blue-50',   iconColor: 'text-brand-blue-600',   value: totalParticipants,     label: 'Total Participants' },
            { icon: Shield,      color: 'bg-green-50',        iconColor: 'text-green-600',         value: activeParticipants,    label: 'Active' },
            { icon: CheckCircle, color: 'bg-brand-orange-50', iconColor: 'text-brand-orange-600',  value: completedParticipants, label: 'Completed' },
            { icon: Briefcase,   color: 'bg-purple-50',       iconColor: 'text-purple-600',        value: `${completionRate}%`,  label: 'Completion Rate' },
          ].map(({ icon: Icon, color, iconColor, value, label }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border p-5">
              <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-600 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Status Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Active',    count: activeParticipants,    color: 'bg-green-500' },
                { label: 'Completed', count: completedParticipants, color: 'bg-brand-blue-500' },
                { label: 'Pending',   count: pendingParticipants,   color: 'bg-yellow-400' },
              ].map(({ label, count, color }) => {
                const pct = totalParticipants > 0 ? Math.round((count / totalParticipants) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-medium text-slate-900">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Participants */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900">Recent Participants</h2>
              <Link href="/admin/jri/participants" className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Participant</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Program</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentParticipants.length > 0 ? (
                    recentParticipants.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-brand-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{p.full_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{p.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{(p.programs as any)?.title || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[p.status] || 'bg-slate-100 text-slate-700'}`}>
                            {p.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No JRI-funded enrollments yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/admin/jri/participants', icon: Users,     label: 'All Participants',   desc: 'View and manage all Job Ready Indy participants' },
            { href: '/admin/jri/reports',      icon: FileText,  label: 'Compliance Reports', desc: 'Generate Job Ready Indy compliance reports' },
            { href: '/admin/funding',          icon: Briefcase, label: 'Funding Tracking',   desc: 'Job Ready Indy funding allocations and disbursements' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
