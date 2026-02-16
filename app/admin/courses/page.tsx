import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Admin Courses | Elevate For Humanity',
  description: 'Admin dashboard',
};

export default async function AdminCoursesPage() {
  const supabase = await createClient();

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

  const { data: courses, count: totalCourses } = await supabase
    .from('courses')
    .select(
      `
      *,
      program:programs(name, slug),
      modules:modules(count)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  const { count: activeCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Calculate stats
  const publishedCount = courses?.filter((c) => c.is_published).length || 0;
  const draftCount = courses?.filter((c) => !c.is_published).length || 0;

  // Get enrollment counts
  const { data: enrollmentCounts } = await supabase
    .from('enrollments')
    .select('course_id');

  const enrollmentMap =
    enrollmentCounts?.reduce((acc: Record<string, any>, e) => {
      acc[e.course_id] = (acc[e.course_id] || 0) + 1;
      return acc;
    }, {}) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Courses' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[380px] lg:h-[420px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes-hq/about-hero.jpg"
          alt="Courses"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            Courses
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
            Transform your career with free training and industry certifications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-brand-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-2xl md:text-3xl lg:text-4xl">
              Course Management
            </h1>
            <p className="text-base md:text-lg text-brand-blue-100">
              Manage all courses and curriculum
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-black">
                  Total Courses
                </h3>
                <svg
                  className="w-8 h-8 text-brand-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="text-3xl font-bold text-black">
                {totalCourses || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-black mb-2">
                Published
              </h3>
              <p className="text-3xl font-bold text-brand-green-600">
                {publishedCount}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-black mb-2">Drafts</h3>
              <p className="text-3xl font-bold text-brand-orange-600">
                {draftCount}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-black mb-2">
                Total Enrollments
              </h3>
              <p className="text-3xl font-bold text-brand-blue-600">
                {enrollmentCounts?.length || 0}
              </p>
            </div>
          </div>

          {/* Course Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">All Courses</h2>
                <p className="text-sm text-black mt-1">
                  Manage course content and settings
                </p>
              </div>
              <div className="flex gap-3">
                <input
                  type="search"
                  placeholder="Search by title or code"
                  className="px-4 py-2 border rounded-lg text-sm"
                />
                <Link
                  href="/admin/course-builder"
                  className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-medium"
                >
                  Create Course
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Enrollments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Level
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courses && courses.length > 0 ? (
                    courses.map((course: Record<string, any>) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {course.thumbnail_url ? (
                              <Image
                                src={course.thumbnail_url as string}
                                alt={course.title as string}
                                width={48}
                                height={48}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-brand-blue-100 flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-brand-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-black">
                                {course.title}
                              </p>
                              <p className="text-xs text-black">
                                {course.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-2 rounded-full text-xs font-medium ${
                              course.is_published
                                ? 'bg-brand-blue-100 text-green-700'
                                : 'bg-gray-100 text-black'
                            }`}
                          >
                            {course.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {enrollmentMap[course.id] || 0} students
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {course.duration_weeks
                            ? `${course.duration_weeks} weeks`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {course.difficulty_level && (
                            <span
                              className={`px-2 py-2 rounded-full text-xs ${
                                course.difficulty_level === 'beginner'
                                  ? 'bg-brand-blue-100 text-green-700'
                                  : course.difficulty_level === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {course.difficulty_level}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="text-brand-blue-600 hover:text-brand-blue-700 mr-3"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="text-black hover:text-black mr-3"
                          >
                            Edit
                          </Link>
                          <button className="text-brand-orange-600 hover:text-red-700" aria-label="Action button">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-black"
                      >
                        <svg
                          className="w-12 h-12 text-black mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <p className="mb-4">No courses found</p>
                        <Link
                          href="/admin/course-builder"
                          className="inline-block px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                        >
                          Create Your First Course
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {courses && courses.length > 0 && (
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-black">
                  Showing {courses.length} of {totalCourses || 0} courses
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 border rounded text-sm hover:bg-white"
                    disabled
                  >
                    Previous
                  </button>
                  <button className="px-3 py-2 border rounded text-sm hover:bg-white" aria-label="Action button">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storytelling Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/artlist/hero-training-4.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
