export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'My Courses | Elevate for Humanity',
  description: 'Manage your courses',
};

export default async function InstructorCoursesPage() {
  let user = null;
  let courses: any[] | null = null;
  let error: string | null = null;
  
  try {
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
    
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        error = 'Authentication error';
      } else {
        user = authData.user;
        
        if (user) {
          const { data, error: queryError } = await db
            .from('training_courses')
            .select('*, training_enrollments(count)')
            .eq('instructor_id', user.id)
            .order('created_at', { ascending: false });
          
          if (queryError) {
            error = 'Database error';
          } else {
            courses = data;
          }
        }
      }
    } catch (innerError) {
      error = 'Unexpected error';
    }
  } catch (outerError) {
    error = 'System error';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Instructor', href: '/instructor' }, { label: 'Courses' }]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
      </div>

      {!user ? (
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
          <p className="text-brand-blue-900 mb-4">
            Please log in to view your courses.
          </p>
          <a
            href="/login"
            className="inline-block bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            Log In
          </a>
        </div>
      ) : !courses || courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <p className="text-black mb-4">No courses assigned yet.</p>
          <p className="text-slate-500 text-sm">
            Contact your program coordinator to get assigned to courses.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/instructor/courses/${course.id}`}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold mb-2">{course.course_name || course.title}</h3>
              <p className="text-black text-sm mb-4 line-clamp-2">
                {course.description}
              </p>
              <div className="text-sm text-slate-500">
                Students: {course.enrollments?.[0]?.count || 0}
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
