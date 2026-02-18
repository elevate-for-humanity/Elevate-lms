import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interactive Courses | LMS',
  description: 'Browse and enroll in interactive courses with quizzes, assignments, and hands-on activities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/courses',
  },
};

export const dynamic = 'force-dynamic';

export default async function InteractiveCoursesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Courses" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get all courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  // Get student's enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, status, progress')
    .eq('user_id', user.id);

  const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || []);
  const enrollmentMap = new Map(enrollments?.map(e => [e.course_id, e]) || []);

  // Category images mapping
  const categoryImages: Record<string, string> = {
    healthcare: '/images/programs-hq/healthcare-hero.jpg',
    trades: '/images/artlist/hero-training-2.jpg',
    technology: '/images/technology/hero-program-cybersecurity.jpg',
    business: '/hero-images/business-hero.jpg',
    default: '/images/healthcare/hero-healthcare-professionals.jpg',
  };

  const courseCategories = [
    {
      image: '/images/healthcare/hero-healthcare-professionals.jpg',
      title: 'Healthcare',
      count: courses?.filter(c => c.category === 'healthcare').length || 0,
      href: '/lms/courses?category=healthcare',
    },
    {
      image: '/images/trades/hero-program-hvac.jpg',
      title: 'Skilled Trades',
      count: courses?.filter(c => c.category === 'trades').length || 0,
      href: '/lms/courses?category=trades',
    },
    {
      image: '/images/technology/hero-program-cybersecurity.jpg',
      title: 'Technology',
      count: courses?.filter(c => c.category === 'technology').length || 0,
      href: '/lms/courses?category=technology',
    },
    {
      image: '/hero-images/business-hero.jpg',
      title: 'Business',
      count: courses?.filter(c => c.category === 'business').length || 0,
      href: '/lms/courses?category=business',
    },
  ];

  // Use database courses with fallback image mapping
  const displayCourses = (courses || []).map((course: any) => ({
    ...course,
    image: course.thumbnail_url || categoryImages[course.category] || categoryImages.default,
    duration: course.duration || 'Self-paced',
    students: course.enrollment_count || 0,
    rating: course.rating || 4.5,
    level: course.level || 'All Levels',
  }));

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Courses" }]} />
        </div>
      {/* Video Hero */}
      {/* Hero */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Interactive Courses</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">Engaging lessons with quizzes, assignments, and hands-on activities</p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {courseCategories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
              >
                <div className="relative h-36">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="font-bold text-lg">{category.title}</h3>
                    <p className="text-white/80 text-sm">{category.count} courses</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Course Grid */}
          <h2 className="text-2xl font-bold text-slate-900 mb-6">All Courses</h2>
          {displayCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500">No courses available yet. Check back soon!</p>
            </div>
          ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course: any) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const enrollment = enrollmentMap.get(course.id);
              
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition"
                >
                  <div className="relative h-44">
                    <Image
                      src={course.image}
                      alt={course.course_name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-brand-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {course.level}
                      </span>
                    </div>
                    {isEnrolled && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-brand-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Enrolled
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-slate-800 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {course.rating}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 mb-2">{course.course_name}</h3>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {(course.students || 0).toLocaleString()}
                      </span>
                    </div>
                    {isEnrolled ? (
                      <Link
                        href={`/lms/courses/${course.id}`}
                        className="block w-full bg-brand-green-600 hover:bg-brand-green-700 text-white text-center py-2 rounded-lg font-medium transition"
                      >
                        Continue Learning ({enrollment?.progress || 0}%)
                      </Link>
                    ) : (
                      <Link
                        href={`/lms/courses/${course.id}`}
                        className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center py-2 rounded-lg font-medium transition"
                      >
                        View Course
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}


        </div>
      </section>
    </div>
  );
}
