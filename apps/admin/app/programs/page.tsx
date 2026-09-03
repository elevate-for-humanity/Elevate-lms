import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ProgramsTable } from './programs-table';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Programs Management | Admin',
  description: 'Manage training programs, courses, and curriculum',
};

export default async function ProgramsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const [
    { data: programs },
    { count: totalPrograms },
    { count: activePrograms },
    { count: featuredPrograms },
    { data: courseRows },
  ] = await Promise.all([
    supabase.from('programs').select('*').eq('is_active', true).order('title', { ascending: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('courses').select('id, program_id').not('program_id', 'is', null),
  ]);

  const programCourseMap: Record<string, string> = {};
  for (const c of courseRows ?? []) {
    if (c.program_id && !programCourseMap[c.program_id]) programCourseMap[c.program_id] = c.id;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-slate-50"><div className="mx-auto max-w-7xl px-4 py-3"><Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Programs' }]} /></div></div>
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div><h1 className="text-3xl font-bold text-black">Programs Management</h1><p className="mt-1 text-black">Manage training programs and curriculum</p></div>
            <Link href="/programs/new" className="rounded-lg bg-brand-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-blue-700">+ Create Program</Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm"><h3 className="mb-1 text-sm font-medium text-black">Total Programs</h3><p className="text-base font-bold text-black md:text-lg">{totalPrograms || 0}</p></div>
            <div className="rounded-lg border bg-white p-4 shadow-sm"><h3 className="mb-1 text-sm font-medium text-black">Active</h3><p className="text-base font-bold text-brand-green-600 md:text-lg">{activePrograms || 0}</p></div>
            <div className="rounded-lg border bg-white p-4 shadow-sm"><h3 className="mb-1 text-sm font-medium text-black">Featured</h3><p className="text-base font-bold text-brand-blue-600 md:text-lg">{featuredPrograms || 0}</p></div>
            <div className="rounded-lg border bg-white p-4 shadow-sm"><h3 className="mb-1 text-sm font-medium text-black">Inactive</h3><p className="text-base font-bold text-black md:text-lg">{(totalPrograms || 0) - (activePrograms || 0)}</p></div>
          </div>
        </div>

        <Link href="/course-builder" className="group mb-6 flex items-center justify-between gap-4 rounded-2xl border border-brand-red-200 bg-gradient-to-r from-brand-red-50 to-white px-6 py-5 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-red-600"><svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.75 3.75 0 01-5.303 0l-.347-.347z" /></svg></div><div><p className="text-sm font-bold text-slate-900">AI Course Builder</p><p className="mt-0.5 text-xs text-slate-500">Describe what you need — the unified builder creates courses with lessons, quizzes, content, media, assessments and compliance tools.</p></div></div>
          <span className="whitespace-nowrap text-sm font-bold text-brand-red-600 group-hover:underline">Open Builder →</span>
        </Link>

        <ProgramsTable programs={programs || []} programCourseMap={programCourseMap} />

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Related</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/program-holders" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"><div><p className="text-sm font-semibold text-slate-900">Program Holders</p><p className="mt-0.5 text-xs text-slate-500">Partner organizations delivering programs</p></div><span className="text-slate-300 transition-colors group-hover:text-slate-600">→</span></Link>
            <Link href="/program-holder-documents" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"><div><p className="text-sm font-semibold text-slate-900">Program Holder Documents</p><p className="mt-0.5 text-xs text-slate-500">MOU, compliance, and onboarding docs</p></div><span className="text-slate-300 transition-colors group-hover:text-slate-600">→</span></Link>
            <Link href="/programs/catalog" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"><div><p className="text-sm font-semibold text-slate-900">Programs Catalog</p><p className="mt-0.5 text-xs text-slate-500">Public-facing program catalog</p></div><span className="text-slate-300 transition-colors group-hover:text-slate-600">→</span></Link>
            <Link href="/courses" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"><div><p className="text-sm font-semibold text-slate-900">Course Library</p><p className="mt-0.5 text-xs text-slate-500">Review published and draft courses</p></div><span className="text-slate-300 transition-colors group-hover:text-slate-600">→</span></Link>
            <Link href="/enrollments" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"><div><p className="text-sm font-semibold text-slate-900">Enrollments</p><p className="mt-0.5 text-xs text-slate-500">Student program enrollments</p></div><span className="text-slate-300 transition-colors group-hover:text-slate-600">→</span></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
