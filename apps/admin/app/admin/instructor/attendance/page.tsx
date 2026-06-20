import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ClipboardList, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Attendance | Instructor Portal',
  robots: { index: false, follow: false },
};

export default async function InstructorAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['instructor', 'admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: records } = await supabase
    .from('attendance_records')
    .select('id, attended_at, status, user_id, session_id, profiles(full_name)')
    .order('attended_at', { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Instructor', href: '/admin/instructor' }, { label: 'Attendance' }]} />
        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-brand-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">Attendance</h1>
          </div>
          <Link href="/lms/attendance" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-600 hover:underline">
            LMS Attendance <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-sm text-slate-500">{records?.length ?? 0} recent records</p>
          </div>
          {!records?.length ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No attendance records found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Student</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 text-slate-900">{(r.profiles as { full_name?: string })?.full_name ?? '—'}</td>
                    <td className="px-6 py-3 text-slate-500">{r.attended_at ? new Date(r.attended_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        r.status === 'present' ? 'bg-green-100 text-green-800' :
                        r.status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>{r.status ?? 'present'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
