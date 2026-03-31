import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Play, Clock, Lock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'My Courses | Elevate for Humanity',
  description: 'Access your purchased career courses.',
};

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/career-services/courses/my-courses');
  }

  // Get user's purchased courses
  const { data: purchases } = await supabase
    .from('career_course_purchases')
    .select(`
      *,
      course:career_courses(
        id,
        slug,
        title,
        subtitle,
        image_url,
        duration_hours,
        lesson_count
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed');

  // Get all available courses for comparison
  const { data: allCourses } = await supabase
    .from('career_courses')
    .select('id, slug, title, subtitle, image_url, price, duration_hours, lesson_count')
    .eq('is_active', true)
    .eq('is_bundle', false);

  const purchasedCourseIds = purchases?.map(p => p.course?.id) || [];
  const unpurchasedCourses = allCourses?.filter(c => !purchasedCourseIds.includes(c.id)) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Courses', href: '/career-services/courses' }, { label: 'My Courses' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">My Courses</h1>
          <p className="text-brand-blue-100">Continue learning and advancing your career</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Purchased Courses */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Courses</h2>
          
          {!purchases || purchases.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">Purchase a course to start learning.</p>
              <Link
                href="/career-services/courses"
                className="inline-flex items-center bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700"
              >
                Browse Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((purchase: any) => (
                <Link
                  key={purchase.id}
                  href={`/career-services/courses/${purchase.course?.slug}/learn`}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={purchase.course?.image_url || '/images/pages/career-services-page-5.jpg'}
                      alt={purchase.course?.title}
                      fill
                      className="object-cover"
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <div className="bg-white rounded-full p-4">
                        <Play className="w-8 h-8 text-brand-blue-600" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-1">{purchase.course?.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{purchase.course?.subtitle}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        {purchase.course?.duration_hours} hours
                      </span>
                      <span className="flex items-center gap-1 text-brand-green-600">
                        <span className="text-slate-500 flex-shrink-0">•</span>
                        Purchased
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recommended Courses */}
        {unpurchasedCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unpurchasedCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={course.image_url || '/images/pages/apply-employer-hero.jpg'}
                      alt={course.title}
                      fill
                      className="object-cover"
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold">
                      ${course.price}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{course.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {course.duration_hours} hours
                      </span>
                      <Link
                        href={`/career-services/courses/${course.slug}`}
                        className="text-brand-blue-600 font-medium text-sm hover:underline"
                      >
                        Learn More →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
