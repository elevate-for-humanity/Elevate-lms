import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gradebook | Admin | Elevate LMS',
  description: 'Select a course to view and manage student grades.',
};

export default async function AdminGradebookIndexPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <h1 className="text-2xl font-bold text-gray-900">Service Unavailable</h1>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'instructor'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  const { data: courses } = await db
    .from('training_courses')
    .select('id, title, enrollment_count, status')
    .order('title');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-gradebook-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-gray-600 mt-1">Select a course to view and manage grades.</p>
        </div>

        <div className="space-y-3">
          {courses && courses.length > 0 ? (
            courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/gradebook/${course.id}`}
                className="flex items-center justify-between bg-white rounded-xl border p-5 hover:shadow-sm transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition">
                      {course.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.enrollment_count || 0} enrolled
                      </span>
                      <span className="capitalize">{course.status || 'draft'}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue-600 transition" />
              </Link>
            ))
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              No courses found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
