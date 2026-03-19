export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, Award, ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ExamReadinessWidget from '@/components/lms/ExamReadinessWidget';

export const metadata: Metadata = {
  title: 'Certification | Elevate LMS',
  description: 'Course complete — your certification next steps',
};

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CertificationPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const db = admin || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/lms/courses/${courseId}/certification`);

  // Course info
  const { data: course } = await db
    .from('courses')
    .select('id, title, program_id')
    .eq('id', courseId)
    .single();

  if (!course) redirect('/lms/courses');

  // Lesson completion stats
  const { data: allLessons } = await db
    .from('lms_lessons')
    .select('id')
    .eq('course_id', courseId);

  const { data: completedLessons } = await db
    .from('lesson_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('completed', true);

  const total = allLessons?.length ?? 0;
  const completed = completedLessons?.length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const courseComplete = pct === 100;

  // Primary credential for this program
  const { data: primaryCred } = course.program_id
    ? await db
        .from('program_credentials')
        .select('credential_id, credential_registry(id, name, abbreviation, issuing_body, exam_url)')
        .eq('program_id', course.program_id)
        .eq('is_primary', true)
        .maybeSingle()
    : { data: null };

  const cred = (primaryCred as any)?.credential_registry ?? null;

  // Existing certification request
  const { data: certRequest } = await db
    .from('certification_requests')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Existing certificate
  const { data: certificate } = await db
    .from('certificates')
    .select('id, issued_at, certificate_url')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Back */}
        <Link href={`/lms/courses/${courseId}`} className="text-sm text-brand-blue-600 hover:underline flex items-center gap-1 mb-8">
          ← Back to course
        </Link>

        {/* Completion banner */}
        <div className={`rounded-2xl p-8 mb-8 text-center ${courseComplete ? 'bg-brand-green-50 border border-brand-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${courseComplete ? 'bg-brand-green-100' : 'bg-amber-100'}`}>
            <CheckCircle className={`w-8 h-8 ${courseComplete ? 'text-brand-green-600' : 'text-amber-600'}`} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {courseComplete ? 'Course Complete' : 'Almost There'}
          </h1>
          <p className="text-slate-600">
            {courseComplete
              ? `You completed all ${total} lessons in ${course.title}.`
              : `You have completed ${completed} of ${total} lessons (${pct}%). Finish all lessons to unlock certification.`}
          </p>
          {/* Progress bar */}
          <div className="mt-4 bg-white rounded-full h-3 overflow-hidden max-w-xs mx-auto">
            <div
              className={`h-3 rounded-full transition-all ${courseComplete ? 'bg-brand-green-500' : 'bg-amber-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">{pct}% complete</p>
        </div>

        {/* Exam readiness — live domain-level status from DB */}
        {course.program_id && (
          <ExamReadinessWidget courseId={courseId} programTitle={course.title} />
        )}

        {/* Certificate issued */}
        {certificate && (
          <div className="bg-white rounded-xl border border-brand-green-200 p-6 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-brand-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Certificate of Completion Issued</p>
              <p className="text-sm text-slate-500">
                Issued {new Date(certificate.issued_at).toLocaleDateString()}
              </p>
            </div>
            {certificate.certificate_url && (
              <a
                href={certificate.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-brand-blue-600 hover:underline"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Credential pathway */}
        {cred && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-blue-600" />
              Industry Credential: {cred.abbreviation}
            </h2>
            <p className="text-slate-600 text-sm mb-4">{cred.name}</p>
            {cred.issuing_body && (
              <p className="text-xs text-slate-500 mb-4">Issued by: {cred.issuing_body}</p>
            )}

            {certRequest ? (
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p className="font-semibold text-slate-700">Certification request submitted</p>
                <p className="text-slate-500 capitalize">Status: {certRequest.status?.replace(/_/g, ' ')}</p>
              </div>
            ) : courseComplete ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  You are eligible to apply for the {cred.abbreviation} exam. Elevate will verify your
                  completion and coordinate exam authorization.
                </p>
                <form action={`/api/certification/initiate`} method="POST">
                  <input type="hidden" name="course_id" value={courseId} />
                  <input type="hidden" name="credential_id" value={cred.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition"
                  >
                    Request Exam Authorization <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                {cred.exam_url && (
                  <a
                    href={cred.exam_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:underline"
                  >
                    Learn about the {cred.abbreviation} exam <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Complete all course lessons to unlock exam authorization.
              </p>
            )}
          </div>
        )}

        {/* Next steps */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Next Steps</h2>
          <div className="space-y-3">
            {!courseComplete && (
              <Link
                href={`/lms/courses/${courseId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
              >
                <BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Continue your course</p>
                  <p className="text-xs text-slate-500">{total - completed} lessons remaining</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
            )}
            <Link
              href="/lms/dashboard"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition"
            >
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-slate-900">Go to your dashboard</p>
                <p className="text-xs text-slate-500">View all your courses and credentials</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
