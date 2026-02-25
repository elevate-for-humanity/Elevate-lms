import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/courses/builder',
  },
  title: 'Course Builder | Elevate For Humanity',
  description: 'Build and structure courses with the visual course builder.',
};

export default async function CourseBuilderPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Program administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/courses" className="hover:text-primary">Courses</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Builder</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Course Builder</h1>
          <p className="text-gray-600 mt-2">Visually build and structure your course content</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border p-4">
            <h2 className="font-semibold mb-4">Content Blocks</h2>
            <div className="space-y-2">
              {['Video Lesson', 'Text Content', 'Quiz', 'Assignment', 'Download'].map((block) => (
                <div key={block} className="p-3 border rounded-lg cursor-move hover:bg-gray-50 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span className="text-sm">{block}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
              <div>
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-500">Drag content blocks here to build your course</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
