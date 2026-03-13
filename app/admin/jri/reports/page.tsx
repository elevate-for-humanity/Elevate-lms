import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, ArrowLeft, CheckCircle, Briefcase, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Job Ready Indy Reports | Elevate For Humanity',
};

export default async function JRIReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/jri/reports');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const [
    { count: total },
    { count: active },
    { count: completed },
    { count: employed },
    { data: participants },
  ] = await Promise.all([
    db.from('jri_participants').select('id', { count: 'exact', head: true }),
    db.from('jri_participants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('jri_participants').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('jri_participants').select('id', { count: 'exact', head: true }).eq('employment_status', 'employed'),
    db.from('jri_participants').select('id, status, program, enrolled_at, employment_status, profiles(full_name, email)').limit(500),
  ]);

  const placementRate = (total || 0) > 0 ? Math.round(((employed || 0) / (total || 1)) * 100) : 0;
  const completionRate = (total || 0) > 0 ? Math.round(((completed || 0) / (total || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Job Ready Indy', href: '/admin/jri' }, { label: 'Reports' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Ready Indy Reports</h1>
              <p className="text-gray-600 mt-1">Indiana DWD compliance reporting</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Enrolled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Completion Rate</p>
            <p className="text-xs text-gray-400 mt-0.5">{completed || 0} completed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{placementRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Placement Rate</p>
            <p className="text-xs text-gray-400 mt-0.5">{employed || 0} employed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-brand-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{active || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Currently Active</p>
          </div>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { title: 'Enrollment Report', desc: 'All participants with enrollment dates and program assignments', period: 'Current period' },
            { title: 'Completion Report', desc: 'Participants who completed training with credential outcomes', period: 'Current period' },
            { title: 'Employment Outcomes', desc: 'Post-program employment status and wage data', period: 'Current period' },
          ].map((r) => (
            <div key={r.title} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-brand-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-blue-600" />
                </div>
                <button className="flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800 border border-brand-blue-200 px-2 py-1 rounded">
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
              <h3 className="font-semibold text-gray-900">{r.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
              <p className="text-xs text-gray-400 mt-2">{r.period}</p>
            </div>
          ))}
        </div>

        {/* Full Participant Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b">
            <h2 className="text-base font-semibold text-gray-900">All Participants — Export Ready</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employment</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {participants && participants.length > 0 ? participants.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.profiles?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.profiles?.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.program || '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.status || '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.employment_status || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString() : '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No participants yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
