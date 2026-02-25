import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ModulesTable } from './modules-table';

export const metadata: Metadata = {
  title: 'Modules Management | Admin',
  description: 'Manage program modules and SCORM packages',
};

export default async function ModulesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Modules" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: modules, count: totalModules } = await db
    .from('modules')
    .select(
      `
      *,
      program:programs(name, slug),
      scorm_package:scorm_packages(id, title, version)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  const { count: scormModules } = await db
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('module_type', 'scorm');

  const { count: lessonModules } = await db
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('module_type', 'lesson');

  const { count: assessmentModules } = await db
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('module_type', 'assessment');

  // Get programs for filtering
  const { data: programs } = await db
    .from('programs')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Modules" }]} />
        </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Modules Management
              </h1>
              <p className="text-black mt-1">
                Manage program modules and SCORM content
              </p>
            </div>
            <Link
              href="/admin/modules/new"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + Create Module
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Total Modules
              </h3>
              <p className="text-base md:text-lg font-bold text-black">
                {totalModules || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                SCORM Packages
              </h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">
                {scormModules || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Lessons
              </h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">
                {lessonModules || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Assessments
              </h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">
                {assessmentModules || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Modules Table */}
        <ModulesTable modules={modules || []} programs={programs || []} />
      </div>
    </div>
  );
}
