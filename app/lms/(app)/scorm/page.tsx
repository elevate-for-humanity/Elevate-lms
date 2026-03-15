import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/scorm' },
  title: 'SCORM Content | Elevate For Humanity',
  description: 'Access SCORM-compliant learning modules.',
};

export default async function ScormPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: packages } = await db
    .from('scorm_packages')
    .select('id, title, description, scorm_version, duration_minutes, courses(id, title)')
    .order('title')
    .limit(30);

  // Get user's progress for each package
  const packageIds = (packages || []).map((p: any) => p.id);
  const { data: progressData } = packageIds.length > 0
    ? await db
        .from('scorm_progress')
        .select('scorm_id, status, progress_percentage')
        .eq('user_id', user.id)
        .in('scorm_id', packageIds)
    : { data: [] };

  const progressMap = new Map((progressData || []).map((p: any) => [p.scorm_id, p]));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/learner/dashboard" className="hover:text-brand-blue-600">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">SCORM Content</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">SCORM Content</h1>
          <p className="text-gray-600 mt-2">Interactive learning modules with embedded progress tracking</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages && packages.length > 0 ? packages.map((pkg: any) => {
            const progress = progressMap.get(pkg.id);
            const isCompleted = progress?.status === 'completed';
            const pct = progress?.progress_percentage || 0;
            const course = pkg.courses as { id: string; title: string } | null;

            return (
              <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-brand-green-100' : 'bg-brand-blue-100'}`}>
                    <svg className={`w-5 h-5 ${isCompleted ? 'text-brand-green-600' : 'text-brand-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">SCORM {pkg.scorm_version || '1.2'}</span>
                  {isCompleted && <span className="text-xs text-brand-green-700 bg-brand-green-100 px-2 py-1 rounded font-medium">Completed</span>}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{pkg.title}</h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{pkg.description || 'Interactive SCORM module'}</p>
                {course && <p className="text-xs text-slate-400 mb-3">Course: {course.course_name}</p>}
                {pkg.duration_minutes && <p className="text-xs text-slate-400 mb-3">{pkg.duration_minutes} min</p>}
                {pct > 0 && !isCompleted && (
                  <div className="mb-3">
                    <div className="h-1.5 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pct}% complete</p>
                  </div>
                )}
                <Link
                  href={`/lms/scorm/${pkg.id}`}
                  className="block w-full text-center bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 font-medium text-sm transition"
                >
                  {isCompleted ? 'Review' : pct > 0 ? 'Continue' : 'Launch'}
                </Link>
              </div>
            );
          }) : (
            <div className="col-span-full bg-white rounded-xl shadow-sm border p-12 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <p className="text-slate-600">No SCORM packages available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
