import Link from 'next/link';
import { CheckCircle, Play } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { JOB_READY_MODULES } from '@/lib/career/job-ready';
import { SupportForm } from '../../support/SupportForm';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Job Ready Indy | Your Career Plan',
  robots: { index: false, follow: false },
};

export default async function JobReadyPage() {
  const { user } = await requireRole([
    'student',
    'learner',
    'apprentice',
    'barber_apprentice',
    'cosmetology_apprentice',
    'admin',
    'super_admin',
    'staff',
  ]);
  const db = await createClient();
  const [{ data: progress, error }, { data: packages, error: packageError }] = await Promise.all([
    db
      .from('scorm_enrollments')
      .select('scorm_package_id,status,progress_percentage')
      .eq('user_id', user.id)
      .in(
        'scorm_package_id',
        JOB_READY_MODULES.map((module) => module.id),
      ),
    db
      .from('scorm_packages')
      .select('id')
      .in(
        'id',
        JOB_READY_MODULES.map((module) => module.id),
      )
      .eq('active', true),
  ]);
  const records = new Map((progress ?? []).map((row) => [row.scorm_package_id, row]));
  const available = new Set((packages ?? []).map((row) => row.id));
  const done = (progress ?? []).filter((row) =>
    ['completed', 'passed'].includes(row.status),
  ).length;
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24">
      <Link href="/lms/dashboard" className="inline-flex min-h-12 items-center font-bold underline">
        Back to my dashboard
      </Link>
      <header className="space-y-3 rounded-2xl bg-amber-50 p-6">
        <p className="font-bold text-amber-950">Your Career Plan</p>
        <h1 className="text-3xl font-bold text-slate-950">Job Ready Indy</h1>
        <p className="max-w-2xl leading-7 text-slate-800">
          Build the workplace skills that support your credential. Start with the introduction, then
          work through the six skill modules at your own pace.
        </p>
        <p className="font-bold text-slate-950">
          {error
            ? 'Saved progress is temporarily unavailable.'
            : `${done} of ${JOB_READY_MODULES.length} learner modules complete`}
        </p>
        <p className="leading-7 text-slate-700">
          Already started? Open a module to return to your saved place. These modules support career
          readiness and do not replace your program credential or professional license.
        </p>
      </header>
      <ol className="grid gap-4 sm:grid-cols-2">
        {JOB_READY_MODULES.map((module, index) => {
          const record = records.get(module.id);
          const complete = record && ['completed', 'passed'].includes(record.status);
          const pct = Math.min(100, Math.max(0, Number(record?.progress_percentage) || 0));
          return (
            <li
              key={module.slug}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start gap-3">
                {complete ? (
                  <CheckCircle aria-hidden="true" className="h-6 w-6 shrink-0 text-green-700" />
                ) : (
                  <Play aria-hidden="true" className="h-6 w-6 shrink-0 text-amber-800" />
                )}
                <h2 className="text-xl font-bold text-slate-950">
                  {index + 1}. {module.title}
                </h2>
              </div>
              <p className="leading-7 text-slate-700">{module.description}</p>
              <p className="font-semibold text-slate-800">
                {error
                  ? 'Progress unavailable'
                  : complete
                    ? 'Complete'
                    : record?.status === 'failed'
                      ? 'Try again'
                      : record
                        ? `In progress · ${Math.round(pct)}%`
                        : 'Not started'}
              </p>
              {available.has(module.id) && !packageError && !error ? (
                <Link
                  href={`/lms/career/job-ready/${module.slug}`}
                  className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
                >
                  {complete ? 'Review module' : record ? 'Continue module' : 'Start module'}
                </Link>
              ) : (
                <p className="text-amber-900">
                  Lesson access is temporarily unavailable. Request help below.
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <section
        id="interview-practice"
        aria-labelledby="interview-title"
        className="scroll-mt-6 space-y-4 rounded-2xl border border-slate-200 p-5"
      >
        <h2 id="interview-title" className="text-2xl font-bold">
          Prepare for your interview
        </h2>
        <p className="leading-7 text-slate-700">
          Practice one answer at a time. Use a real example from training, work, or your
          apprenticeship.
        </p>
        {[
          [
            'Tell me about yourself.',
            'Name your training, the credential you earned, and the kind of work you want.',
          ],
          [
            'Tell me about a challenge you solved.',
            'Explain the situation, what you did, and the result.',
          ],
          [
            'How do you work safely and with others?',
            'Describe a safety procedure or a time you communicated well with your team.',
          ],
          [
            'Why are you interested in this job?',
            'Connect your skills to the employer’s requirements. Prepare one question to ask them.',
          ],
        ].map(([question, tip]) => (
          <details key={question} className="rounded-xl bg-slate-50 p-4">
            <summary className="min-h-12 cursor-pointer font-bold leading-7">{question}</summary>
            <p className="mt-2 leading-7 text-slate-700">{tip}</p>
          </details>
        ))}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/lms/resume-builder"
            className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
          >
            Update my résumé
          </Link>
          <Link
            href="/lms/career"
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 font-bold"
          >
            Find career opportunities
          </Link>
        </div>
      </section>
      <section id="career-support" className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-2xl font-bold">Request career support</h2>
        <p className="mt-2 leading-7 text-slate-700">
          Ask for résumé feedback, interview practice, job-search help, or help opening Job Ready.
        </p>
        <SupportForm defaultSubject="Career Services: Job Ready and career plan" />
      </section>
    </main>
  );
}
