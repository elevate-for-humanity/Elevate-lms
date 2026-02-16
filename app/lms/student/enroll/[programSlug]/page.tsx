import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, Award, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ programSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { programSlug } = await params;
  const title = programSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: `Enroll in ${title} | Elevate for Humanity`,
    description: `Start your enrollment in the ${title} program.`,
  };
}

export default async function EnrollProgramPage({ params }: Props) {
  const { programSlug } = await params;
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/lms/student/enroll/${programSlug}`);
  }

  // Try to find the course/program
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', programSlug)
    .single();

  const programTitle = course?.title || programSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-slate-700 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">Enroll in {programTitle}</h1>
            <p className="text-brand-blue-100">Complete your enrollment to get started</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {course ? (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Program Details</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-brand-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">{course.duration || '8-16 weeks'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Award className="w-5 h-5 text-brand-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">Certification</p>
                        <p className="font-medium">Industry Recognized</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <div>
                        <p className="text-sm text-gray-500">Cost</p>
                        <p className="font-medium text-green-600">Free with WIOA</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center font-semibold">1</span>
                      <div>
                        <p className="font-medium text-gray-900">Verify WIOA Eligibility</p>
                        <p className="text-sm text-gray-600">Complete the eligibility check to qualify for free training</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center font-semibold">2</span>
                      <div>
                        <p className="font-medium text-gray-900">Submit Application</p>
                        <p className="text-sm text-gray-600">Provide your information and select your preferred start date</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center font-semibold">3</span>
                      <div>
                        <p className="font-medium text-gray-900">Begin Training</p>
                        <p className="text-sm text-gray-600">Start your journey to a new career</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/wioa-eligibility"
                    className="flex-1 bg-brand-blue-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
                  >
                    Check Eligibility <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/programs/${programSlug}`}
                    className="flex-1 border border-gray-300 text-gray-700 text-center py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    View Program Details
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-6">
                  Ready to enroll in {programTitle}? Start by checking your eligibility for free training.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/wioa-eligibility"
                    className="bg-brand-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
                  >
                    Check Eligibility
                  </Link>
                  <Link
                    href="/programs"
                    className="border border-gray-300 text-gray-700 py-3 px-8 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Browse Programs
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
