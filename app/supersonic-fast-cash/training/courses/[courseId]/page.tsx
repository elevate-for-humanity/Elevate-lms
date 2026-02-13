import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, Clock, Award, CheckCircle, PlayCircle, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TrainingLesson {
  id: string;
  course_id: string;
  lesson_number: number;
  title: string;
  content: string;
  duration_minutes: number;
  topics: string[];
}

interface TrainingCourse {
  id: string;
  course_id: string;
  title: string;
  description: string;
  duration: string;
  lessons_count: number;
  price: number;
  certification_name: string;
}

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const { courseId } = await params;
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
  
  const { data: course } = await supabase
    .from('training_courses')
    .select('title, description')
    .eq('course_id', courseId)
    .single();

  if (!course) {
    return { title: 'Course Not Found' };
  }

  return {
    title: `${course.title} | Tax Preparer Training`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  // Fetch course
  const { data: course } = await supabase
    .from('training_courses')
    .select('*')
    .eq('course_id', courseId)
    .single();

  // Fetch lessons
  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('lesson_number', { ascending: true });

  if (!course) {
    notFound();
  }

  const totalMinutes = lessons?.reduce((sum, l) => sum + (l.duration_minutes || 30), 0) || 0;
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "[Courseid]" }]} />
      </div>
{/* Hero */}
      <section className="bg-slate-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href="/supersonic-fast-cash/training/courses"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Courses
          </Link>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {course.title}
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{lessons?.length || course.lessons_count} Lessons</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                  <Clock className="w-5 h-5" />
                  <span>{totalHours} Hours</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                  <Award className="w-5 h-5" />
                  <span>Certificate Included</span>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-xl p-6 text-gray-900">
              <div className="text-4xl font-bold mb-2">${course.price}</div>
              <p className="text-gray-600 mb-4">One-time payment</p>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Lifetime access</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Certificate of completion</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Practice exercises</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Quiz assessments</span>
                </li>
              </ul>

              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors mb-3">
                Enroll Now
              </button>
              
              <p className="text-xs text-center text-gray-500">
                Free for hired tax preparers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-6">Course Content</h2>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {lessons && lessons.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500">
                            Lesson {lesson.lesson_number}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {lesson.duration_minutes || 30} min
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {lesson.title}
                        </h3>
                        {lesson.topics && lesson.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lesson.topics.slice(0, 3).map((topic, i) => (
                              <span
                                key={i}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Lesson content is being prepared.</p>
                <p className="text-sm mt-2">Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Certification */}
      <section className="py-12 bg-green-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold mb-2">Earn Your Certificate</h2>
          <p className="text-gray-600 mb-4">
            Complete all lessons and pass the final assessment to earn your
          </p>
          <p className="text-xl font-semibold text-green-700">
            {course.certification_name}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-gray-600 mb-6">
            Join our team and get this training for free, or purchase individually.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/careers"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Apply to Join Our Team
            </Link>
            <button className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Purchase Course - ${course.price}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
