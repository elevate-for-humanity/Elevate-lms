import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: { courseId: string };
}): Promise<Metadata> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      title: 'Course | Elevate for Humanity',
      description: 'Workforce training course at Elevate for Humanity.',
    };
  }
  
  const { data: course } = await supabase
    .from('courses')
    .select('title, description')
    .eq('id', params.courseId)
    .single();

  if (!course) {
    return {
      title: 'Course Not Found | Elevate for Humanity',
      description: 'The requested course could not be found.',
    };
  }

  return {
    title: `${course.title} | Elevate for Humanity`,
    description: course.description || `Learn ${course.title} with Elevate for Humanity workforce training programs.`,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/courses/${params.courseId}`,
    },
  };
}
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, Award, BookOpen, Play } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const supabase = await createClient();
  const { courseId } = params;

  // Fetch course details
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Fetch lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index');

  // Check if user is enrolled
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let enrollment = null;
  if (user) {
    const { data }: any = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();
    enrollment = data;
  }

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: course.title },
        ]}
      />
      {/* Hero Section */}
      {/* Hero */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">{course.description}</p>
        </div>
      </section>

      {/* Course Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-black text-black mb-6">
              What You'll Learn
            </h2>
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-black">{course.description}</p>
            </div>

            {/* Lessons */}
            <h2 className="text-3xl font-black text-black mb-6">
              Course Curriculum
            </h2>
            <div className="space-y-4">
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue-500 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-brand-blue-600 font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-black mb-2">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-black">{lesson.description}</p>
                        )}
                      </div>
                      {enrollment && (
                        <span className="text-slate-400 flex-shrink-0">•</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-black">
                  Course content is being prepared. Check back soon!
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 sticky top-24">
              <h3 className="text-2xl font-black text-black mb-6">
                Course Details
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Award className="h-10 w-10 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Certificate</div>
                    <div className="text-sm text-black">Upon completion</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-10 w-10 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Duration</div>
                    <div className="text-sm text-black">
                      {course.duration || 'Self-paced'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BookOpen className="h-10 w-10 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Lessons</div>
                    <div className="text-sm text-black">
                      {lessons?.length || 0} lessons
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-10 w-10 text-brand-blue-600" />
                  <div>
                    <div className="font-bold text-black">Access</div>
                    <div className="text-sm text-black">Lifetime access</div>
                  </div>
                </div>
              </div>

              {!enrollment && (
                <Link
                  href={user ? `/courses/${courseId}/enroll` : '/login'}
                  className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-bold transition-colors"
                >
                  {user ? 'Enroll Now' : 'Sign In to Enroll'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
