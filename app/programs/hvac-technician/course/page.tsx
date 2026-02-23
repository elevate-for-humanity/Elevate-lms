import { Metadata } from 'next';
import { getCourseBySlug } from '@/lib/courses/definitions';
import HvacCourseViewer from './HvacCourseViewer';

export const metadata: Metadata = {
  title: 'HVAC Technician Course | Full Curriculum | Elevate for Humanity',
  description:
    'Browse the full HVAC Technician course: 16 modules, 94 lessons with video, audio, quizzes, and hands-on labs. No login required.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/hvac-technician/course',
  },
};

export default function HvacCoursePage() {
  const course = getCourseBySlug('hvac-technician');

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Course data not available.</p>
      </div>
    );
  }

  return <HvacCourseViewer course={course} />;
}
