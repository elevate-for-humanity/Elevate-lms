import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { generateMetadata } from '@/lib/seo/metadata';
import Link from 'next/link';
import { CheckCircle, Play, Award, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateMetadata({
  title: 'Enrollment Successful',
  description: 'Your enrollment is complete. Start learning now!',
  path: '/courses/success',
});

export default async function EnrollmentSuccessPage({
  params,
}: {
  params: { courseId: string };
}) {
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
  
  // Fetch course info
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('id', params.courseId)
    .single();
  return (
    <div className="min-h-screen bg-slate-700 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="bg-white rounded-2xl border-2 border-green-500 p-8 shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-black text-black mb-4">
            🎉 Enrollment Successful!
          </h1>
          
          <p className="text-xl text-black mb-8">
            Welcome to the course! You now have instant access to all course materials.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href={`/courses/${params.courseId}/learn`}
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors"
            >
              <Play className="h-5 w-5" />
              Start Learning Now
            </Link>
            
            <Link
              href="/client-portal"
              className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-black px-8 py-4 rounded-xl text-lg font-bold transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              Go to Dashboard
            </Link>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              📧 <strong>Check your email</strong> - We've sent you a confirmation with course access details and next steps.
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="mt-12 bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            What's Next?
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">
                  Start Your First Lesson
                </h3>
                <p className="text-black">
                  Jump right in and begin learning. All course materials are now available.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">
                  Track Your Progress
                </h3>
                <p className="text-black">
                  Monitor your completion status and see how far you've come in your dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-bold text-black mb-1">
                  Earn Your Certificate
                </h3>
                <p className="text-black">
                  Complete all lessons and assessments to receive your certificate of completion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 bg-white rounded-2xl border-2 border-gray-200 p-8 text-center">
          <h2 className="text-xl font-bold text-black mb-4">
            Need Help Getting Started?
          </h2>
          <p className="text-black mb-4">
            Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              Call support center
            </a>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-black px-6 py-3 rounded-lg font-bold transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
