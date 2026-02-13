import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BookOpen, Clock, Award, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tax Preparer Courses | Supersonic Fast Cash',
  description: 'Professional tax preparer training courses. Learn tax preparation fundamentals, IRS regulations, advanced returns, and business taxes.',
};

export const dynamic = 'force-dynamic';

interface TrainingCourse {
  id: string;
  course_id: string;
  title: string;
  description: string;
  duration: string;
  lessons_count: number;
  price: number;
  certification_name: string;
  is_active: boolean;
}

export default async function TrainingCoursesPage() {
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
  
  const { data: courses, error } = await supabase
    .from('training_courses')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const displayCourses = courses || [];
  const totalLessons = displayCourses.reduce((sum, c) => sum + c.lessons_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Courses" }]} />
      </div>
{/* Hero */}
      <section className="bg-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tax Preparer Training Courses
            </h1>
            <p className="text-xl text-orange-100 mb-6">
              {displayCourses.length} professional courses with {totalLessons} lessons to become a certified tax preparer
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="font-semibold">{displayCourses.length} Courses</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="font-semibold">{totalLessons} Lessons</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="font-semibold">Self-Paced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayCourses.map((course) => (
              <div
                key={course.course_id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Course Header */}
                <div className="bg-slate-700 p-6 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <BookOpen className="w-8 h-8" />
                    <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                      ${course.price}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{course.title}</h3>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.lessons_count} lessons</span>
                    </div>
                  </div>

                  {/* Certification */}
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                    <Award className="w-4 h-4" />
                    <span className="line-clamp-1">{course.certification_name}</span>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/supersonic-fast-cash/training/courses/${course.course_id}`}
                    className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    View Course
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundle CTA */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Complete Training Bundle</h2>
          <p className="text-xl text-blue-200 mb-6">
            Get all {displayCourses.length} courses and {totalLessons} lessons for one low price
          </p>
          <div className="bg-white/10 rounded-xl p-8 mb-8">
            <div className="text-5xl font-bold mb-2">$799</div>
            <div className="text-blue-200">Save over $200 vs individual courses</div>
          </div>
          <Link
            href="/supersonic-fast-cash/careers"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            Apply to Join Our Team
          </Link>
          <p className="text-sm text-blue-300 mt-4">
            Training is provided free to hired tax preparers
          </p>
        </div>
      </section>
    </div>
  );
}
