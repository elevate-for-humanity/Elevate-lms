import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HSICoursePlayer } from './HSICoursePlayer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ 
  params 
}: { 
  params: { courseType: string } 
}): Promise<Metadata> {
  const courseType = params.courseType;
  const formattedName = courseType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: `${formattedName} | HSI Training | Elevate For Humanity`,
    description: `Complete your ${formattedName} training through HSI. Access your course content and track your progress.`,
    robots: { index: false, follow: false },
  };
}

export default async function HSILearnPage({ 
  params 
}: { 
  params: { courseType: string } 
}) {
  const supabase = await createClient();


  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/courses/hsi/' + params.courseType + '/learn');
  }

  // Get the HSI course product
  const { data: course } = await supabase
    .from('hsi_course_products')
    .select('*')
    .eq('course_type', params.courseType)
    .single();

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-black mb-4">The requested course could not be found.</p>
          <a href="/courses/hsi" className="text-brand-blue-600 hover:underline">
            Browse HSI Courses
          </a>
        </div>
      </div>
    );
  }

  // Check if user has an active enrollment
  const { data: enrollment } = await supabase
    .from('hsi_enrollment_queue')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_type', params.courseType)
    .eq('enrollment_status', 'enrolled')
    .single();

  if (!enrollment) {
    // Check for pending enrollment
    const { data: pendingEnrollment } = await supabase
      .from('hsi_enrollment_queue')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_type', params.courseType)
      .eq('enrollment_status', 'pending')
      .single();

    if (pendingEnrollment) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Enrollment Processing</h1>
            <p className="text-black mb-4">
              Your enrollment is being processed. You'll receive an email with access instructions shortly.
            </p>
            <a href="/dashboard" className="text-brand-blue-600 hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }

    // No enrollment found - redirect to enroll
    redirect('/programs/cpr-first-aid');
  }

  return (
    <HSICoursePlayer
      courseId={course.id}
      courseName={course.course_name}
      hsiUrl={course.hsi_enrollment_link}
      userId={user.id}
      enrollmentId={enrollment.id}
    />
  );
}
