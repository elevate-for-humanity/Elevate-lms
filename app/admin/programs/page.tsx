import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ProgramsTable } from './programs-table';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/programs',
  },
  title: 'Programs Management | Admin',
  description: 'Manage training programs, courses, and curriculum',
};

export default async function ProgramsPage() {
  await requireRole(['admin', 'super_admin']);
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
    // Map program_id → course_id so the table can link to /lms/courses/[id]
    supabase.from('courses').select('id, program_id').not('program_id', 'is', null),
  ]);

  // Build lookup: program_id → course_id
  const programCourseMap: Record<string, string> = {};
  for (const c of courseRows ?? []) {
    if (c.program_id && !programCourseMap[c.program_id]) {
      programCourseMap[c.program_id] = c.id;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Programs' }]} />
        </div>
      </div>

      {/* Hero Image */}

      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Programs Management</h1>
              <p className="text-black mt-1">Manage training programs and curriculum</p>
            </div>
            <Link
              href="/admin/programs/new"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + Create Program
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Total Programs</h3>
              <p className="text-base md:text-lg font-bold text-black">{totalPrograms || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Active</h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">
                {activePrograms || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Featured</h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">
                {featuredPrograms || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Inactive</h3>
              <p className="text-base md:text-lg font-bold text-black">
                {(totalPrograms || 0) - (activePrograms || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* AI Course Builder CTA */}
        <Link
          href="/admin/studio"
          className="flex items-center justify-between gap-4 rounded-2xl border border-brand-red-200 bg-gradient-to-r from-brand-red-50 to-white px-6 py-5 mb-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-red-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.75 3.75 0 01-5.303 0l-.347-.347z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">AI Course Builder</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Describe what you need — the AI builds the full course with lessons, quizzes, and content. Or click <strong>✦ Build Course</strong> next to any program below.
              </p>
            </div>
          </div>
          <span className="text-brand-red-600 font-bold text-sm whitespace-nowrap group-hover:underline">
            Open Builder →
          </span>
        </Link>

        {/* Programs Table */}
        <ProgramsTable programs={programs || []} programCourseMap={programCourseMap} />

        {/* Related sections */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Related</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/program-holders" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Program Holders</p>
                <p className="text-xs text-slate-500 mt-0.5">Partner organizations delivering programs</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/program-holder-documents" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Program Holder Documents</p>
                <p className="text-xs text-slate-500 mt-0.5">MOU, compliance, and onboarding docs</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/studio" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Program Builder</p>
                <p className="text-xs text-slate-500 mt-0.5">Blueprint-driven course scaffolding</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/programs/catalog" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Programs Catalog</p>
                <p className="text-xs text-slate-500 mt-0.5">Public-facing program catalog</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/studio" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Curriculum</p>
                <p className="text-xs text-slate-500 mt-0.5">Lessons, modules, and content</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
            <Link href="/admin/enrollments" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:shadow-md transition-shadow group">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Enrollments</p>
                <p className="text-xs text-slate-500 mt-0.5">Student program enrollments</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
