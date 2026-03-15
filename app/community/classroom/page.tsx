import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Play, Clock, Users, Star, Lock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Classroom | Community | Elevate For Humanity',
  description: 'Access exclusive courses, tutorials, and learning resources in our community classroom.',
};

export const dynamic = 'force-dynamic';

export default async function ClassroomPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Fetch courses from database
  const { data: courses, error } = await db
    .from('training_courses')
    .select('id, course_name, description, duration_hours, image_url, is_active, price')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    console.error('Error fetching courses:', error.message);
  }

  // Get enrollment counts
  const courseIds = courses?.map(c => c.id) || [];
  const enrollmentCounts: Record<string, number> = {};

  if (courseIds.length > 0) {
    const { data: enrollments } = await db
      .from('program_enrollments')
      .select('course_id')
      .in('course_id', courseIds);

    if (enrollments) {
      enrollments.forEach((e: any) => {
        enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
      });
    }
  }

  const courseList = courses || [];
  const totalCourses = courseList.length;
  const totalStudents = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Classroom' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/community-page-1.jpg" alt="Community Classroom" fill className="object-cover" priority sizes="100vw" />
      </section>

      {/* Stats */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
              <p className="text-gray-600">Courses</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalCourses * 8}+</p>
              <p className="text-gray-600">Video Lessons</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalStudents || 0}</p>
              <p className="text-gray-600">Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <p className="text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section id="courses" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Courses</h2>
              <p className="text-gray-600">Start learning with our courses</p>
            </div>
          </div>

          {courseList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Available</h3>
              <p className="text-gray-600 mb-6">No courses are published yet. Contact us to learn about upcoming programs.</p>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700"
              >
                Back to Community
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courseList.map((course: any) => {
                const studentCount = enrollmentCounts[course.id] || 0;
                const isFree = !course.price || course.price === 0;

                return (
                  <div key={course.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="relative h-48 overflow-hidden">
                      {course.image_url ? (
                        <Image
                          src={course.image_url}
                          alt={course.course_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-brand-green-600 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-white/50" />
                        </div>
                      )}
                      {isFree ? (
                        <span className="absolute top-4 left-4 bg-brand-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          FREE
                        </span>
                      ) : (
                        <span className="absolute top-4 left-4 bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> PREMIUM
                        </span>
                      )}
                      <button className="absolute inset-0 flex items-center justify-center bg-slate-800/20 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-brand-green-600 ml-1" />
                        </div>
                      </button>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2">{course.course_name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration_hours || 2} hours
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {studentCount} students
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium text-gray-900">4.8</span>
                        </div>
                      </div>

                      <Link
                        href={`/courses/${course.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-green-600 text-white font-medium rounded-lg hover:bg-brand-green-700 transition-colors"
                      >
                        {isFree ? 'Start Learning' : 'View Course'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-brand-green-100 mb-8 max-w-2xl mx-auto">
            Join our community to access all free courses and unlock premium content.
          </p>
          <Link
            href="/community/join"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-green-600 font-semibold rounded-full hover:bg-brand-green-50 transition-colors"
          >
            Join the Community
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
