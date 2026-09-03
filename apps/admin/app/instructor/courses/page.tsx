import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `My Courses | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Manage your courses',
};

export default async function InstructorCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

  let courses: any[] = [];
  let error: string | null = null;

  try {
    const { data, error: queryError } = await supabase
      .from('lms_courses')
      .select('*, training_enrollments(count)')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('[instructor/courses] query failed', queryError);
      error = 'Courses could not be loaded.';
    } else {
      courses = data ?? [];
    }
  } catch (cause) {
    console.error('[instructor/courses] unexpected failure', cause);
    error = 'Courses could not be loaded.';
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] overflow-hidden sm:h-[220px] md:h-[280px]">
        <Image
          src="/images/pages/instructor-page-7.webp"
          alt="Instructor portal"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Instructor', href: '/instructor' }, { label: 'Courses' }]}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Courses</h1>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">{error}</div>
        ) : courses.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-black">No courses assigned yet.</p>
            <p className="text-sm text-slate-500">
              Contact your program coordinator to get assigned to courses.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/instructor/courses/${course.id}`}
                className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h3 className="mb-2 text-xl font-semibold">{course.course_name || course.title}</h3>
                <p className="mb-4 line-clamp-2 text-sm text-black">{course.description}</p>
                <div className="text-sm text-slate-500">
                  Students: {course.training_enrollments?.[0]?.count || 0}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
