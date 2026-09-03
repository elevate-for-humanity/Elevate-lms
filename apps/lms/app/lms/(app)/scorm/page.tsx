import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SCORM Content', description: 'Access SCORM-compliant learning modules.' };

type CourseRelation = { id: string; title: string } | Array<{ id: string; title: string }> | null;

function courseTitle(value: CourseRelation): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.title ?? null;
}

export default async function ScormPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: packages } = await supabase
    .from('scorm_packages')
    .select('id, title, description, scorm_version, duration_minutes, courses(id, title)')
    .order('title')
    .limit(30);

  const packageIds = (packages || []).map((pkg: any) => pkg.id);
  const { data: progressData } = packageIds.length
    ? await supabase.from('scorm_progress').select('scorm_id, status, progress_percentage').eq('user_id', user.id).in('scorm_id', packageIds)
    : { data: [] as any[] };
  const progressMap = new Map((progressData || []).map((row: any) => [row.scorm_id, row]));

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8"><Link href="/lms/dashboard" className="text-sm text-brand-blue-700">LMS</Link><h1 className="mt-3 text-3xl font-bold text-slate-950">SCORM Content</h1><p className="mt-2 text-slate-700">Interactive learning modules with embedded progress tracking.</p></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages?.length ? packages.map((pkg: any) => {
            const progress = progressMap.get(pkg.id) as any;
            const isCompleted = progress?.status === 'completed';
            const pct = Number(progress?.progress_percentage || 0);
            const linkedCourse = courseTitle(pkg.courses as CourseRelation);
            return (
              <article key={pkg.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">SCORM {pkg.scorm_version || '1.2'}</span>{isCompleted ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Completed</span> : null}</div>
                <h2 className="font-semibold text-slate-950">{pkg.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{pkg.description || 'Interactive SCORM module'}</p>
                {linkedCourse ? <p className="mt-3 text-xs text-slate-500">Course: {linkedCourse}</p> : null}
                {pkg.duration_minutes ? <p className="mt-1 text-xs text-slate-500">{pkg.duration_minutes} min</p> : null}
                {pct > 0 && !isCompleted ? <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-blue-600" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div><p className="mt-1 text-xs text-slate-500">{pct}% complete</p></div> : null}
                <Link href={`/lms/scorm/${pkg.id}`} className="mt-5 block rounded-lg bg-brand-blue-600 px-4 py-2 text-center text-sm font-bold text-white">{isCompleted ? 'Review' : pct > 0 ? 'Continue' : 'Launch'}</Link>
              </article>
            );
          }) : <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-600">No SCORM packages available yet.</div>}
        </div>
      </div>
    </main>
  );
}
