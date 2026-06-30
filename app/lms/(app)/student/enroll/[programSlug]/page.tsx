import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, Award, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ programSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { programSlug } = await params;
  const title = programSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `Enroll in ${title} | ${PLATFORM_DEFAULTS.orgName}`,
    description: `Start your enrollment in the ${title} program.`,
  };
}

export default async function EnrollProgramPage({ params }: Props) {
  const { programSlug } = await params;
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/lms/student/enroll/${programSlug}`);
  }

  // Resolve program from canonical `programs` table
  const { data: course } = await supabase
    .from('programs')
    .select('id, slug, title, description, credential, is_active')
    .or(`slug.eq.${programSlug},id.eq.${programSlug}`)
    .eq('is_active', true)
    .maybeSingle();

  if (!course) notFound();

  const programTitle = course.title;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-slate-700 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">Enroll in {programTitle}</h1>
            <p className="text-brand-blue-100">Complete your enrollment to get started</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Program Details</h2>
              {course.description && <p className="text-slate-600 mb-4">{course.description}</p>}
              <div className="grid md:grid-cols-2 gap-4">
                {course.credential && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Award aria-label="award" className="w-5 h-5 text-brand-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Credential</p>
                      <p className="font-medium">{course.credential}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Clock className="w-5 h-5 text-brand-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Cost</p>
                    <p className="font-medium text-brand-green-600">Free with WIOA when eligible</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Next Steps</h2>
              <ol className="space-y-4">
                {[
                  [
                    'Verify WIOA Eligibility',
                    'Complete the eligibility check to qualify for funded training',
                  ],
                  [
                    'Submit Application',
                    'Provide your information and select your preferred start date',
                  ],
                  ['Begin Training', 'Start your journey to a new career'],
                ].map(([title, desc], i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{title}</p>
                      <p className="text-sm text-slate-600">{desc}</p>
                    </div>
                  </li>
                ))}
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
                href={`/programs/${course.slug}`}
                className="flex-1 border border-slate-300 text-slate-900 text-center py-3 px-6 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                View Program Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
