import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Gradebook | Instructor Portal',
  robots: { index: false, follow: false },
};

export default async function InstructorGradebookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  // Guard against null user
  if (!user) redirect('/login');
  if (!profile || !['instructor', 'admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: submissions } = await supabase
    .from('step_submissions')
    .select('id, status, submitted_at, lesson_id, user_id, profiles(full_name), curriculum_lessons(title)')
    .order('submitted_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Instructor', href: '/admin/instructor' }, { label: 'Gradebook' }]} />
        <div className="flex items-center gap-3 mb-6 mt-4">
          <ClipboardList className="w-7 h-7 text-brand-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900">Gradebook</h1>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-sm text-slate-500">{submissions?.length ?? 0} recent submissions</p>
          </div>
          {!submissions?.length ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No submissions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Student</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Lesson</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 text-slate-900">{(s.profiles as { full_name?: string })?.full_name ?? '—'}</td>
                    <td className="px-6 py-3 text-slate-700">{(s.curriculum_lessons as { title?: string })?.title ?? s.lesson_id}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        s.status === 'approved' ? 'bg-green-100 text-green-800' :
                        s.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}</td>
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
