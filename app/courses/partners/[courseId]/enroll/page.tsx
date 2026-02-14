
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {

  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface PartnerCourse {
  id: string;
  title: string;
  description: string;
  duration_hours: number;
  category: string;
  retail_price: number;
  enrollment_url: string;
  provider: {
    id: string;
    name: string;
    provider_type: string;
  };
}

export default function EnrollPage({
  params,
}: {
  params: { courseId: string };
}) {
  const router = useRouter();
  const [course, setCourse] = useState<PartnerCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadCourse() {
      const supabase = createClient();

      // Check authentication
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push(`/login?next=/courses/partners/${params.courseId}/enroll`);
        return;
      }
      setUser(currentUser);

      // Load course details
      const { data: courseData, error: courseError } = await supabase
        .from('partner_lms_courses')
        .select(
          `
          *,
          provider:partner_lms_providers(*)
        `
        )
        .eq('id', params.courseId)
        .single();

      if (courseError || !courseData) {
        setError('Course not found');
        setLoading(false);
        return;
      }

      setCourse(courseData as PartnerCourse);
      setLoading(false);
    }

    loadCourse();
  }, [params.courseId, router]);

  async function handleEnroll() {
    if (!course || !user) return;

    setEnrolling(true);
    setError(null);

    try {
      const response = await fetch('/api/partner/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerCourseId: course.id,
          programId: null, // Optional: link to a program
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      // Check if SCORM package is available
      if (data.hasScorm && data.scormPackage) {
        // Redirect to SCORM player
        router.push(`/student/scorm/${data.enrollment.id}`);
      } else {
        // Redirect to partner LMS
        window.location.href = course.enrollment_url;
      }
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to enroll. Please try again.'
      );
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto"></div>
          <p className="mt-4 text-black">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">
            <AlertTriangle className="w-5 h-5 inline-block" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Course Not Found
          </h1>
          <p className="text-black mb-6">{error}</p>
          <Link
            href="/courses/partners"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Courses", href: "/courses" }, { label: "Enroll" }]} />
      </div>
{/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/courses/partners"
            className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Courses
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Confirm Enrollment
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Course Header */}
          <div className="bg-brand-blue-600 text-white p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="inline-block px-3 py-2 bg-white/20 text-white text-xs font-semibold rounded-full mb-3">
                  {course.category}
                </span>
                <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
                <p className="text-blue-100 text-sm">
                  Provided by {course.provider.name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {course.retail_price === 0
                    ? 'FREE'
                    : `$${course.retail_price}`}
                </div>
                {course.retail_price === 0 && (
                  <div className="text-xs text-blue-100 mt-1">
                    Through WIOA funding
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black mb-2">
                About This Course
              </h3>
              <p className="text-black leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Course Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Clock className="w-5 h-5 text-brand-blue-600" />
                <div>
                  <div className="text-sm text-black">Duration</div>
                  <div className="font-semibold text-black">
                    {course.duration_hours} hours
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-brand-blue-600" />
                <div>
                  <div className="text-sm text-black">Format</div>
                  <div className="font-semibold text-black">
                    Online Self-Paced
                  </div>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-blue-600" />
                What Happens Next
              </h3>
              <ol className="space-y-3 text-black">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <span>You'll be enrolled in this course</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <span>
                    You'll be redirected to {course.provider.name}'s platform
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <span>Complete the training at your own pace</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <span>Receive your certificate upon completion</span>
                </li>
              </ol>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="flex-1 px-8 py-4 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enrolling...
                  </>
                ) : (
                  <>
                    Confirm Enrollment
                    <ExternalLink className="w-5 h-5" />
                  </>
                )}
              </button>
              <Link
                href="/courses/partners"
                className="px-8 py-4 bg-slate-100 text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>

            {/* Fine Print */}
            <p className="text-xs text-slate-500 mt-6 text-center">
              By enrolling, you agree to complete the course and follow the
              partner's terms of service. This course is provided by{' '}
              {course.provider.name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
