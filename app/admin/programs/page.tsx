import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProgramsTable } from './programs-table';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/programs',
  },
  title: 'Programs Management | Admin',
  description: 'Manage training programs, courses, and curriculum',
};

export default async function ProgramsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: programs, count: totalPrograms } = await supabase
    .from('programs')
    .select(
      `
      *,
      modules:modules(count)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  const { count: activePrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: featuredPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('featured', true);

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-3xl font-bold text-black">
                Programs Management
              </h1>
              <p className="text-black mt-1">
                Manage training programs and curriculum
              </p>
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
              <h3 className="text-sm font-medium text-black mb-1">
                Total Programs
              </h3>
              <p className="text-base md:text-lg font-bold text-black">
                {totalPrograms || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Active</h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">
                {activePrograms || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Featured
              </h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">
                {featuredPrograms || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">
                Inactive
              </h3>
              <p className="text-base md:text-lg font-bold text-black">
                {(totalPrograms || 0) - (activePrograms || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Programs Table */}
        <ProgramsTable programs={programs || []} />
      </div>
    </div>
  );
}
