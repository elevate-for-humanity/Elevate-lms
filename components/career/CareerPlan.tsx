import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, Briefcase, FileText, MessageSquare } from 'lucide-react';
import type { CareerPlan as Plan } from '@/lib/career/plan';
import { JOB_READY_MODULES } from '@/lib/career/job-ready';

export function CareerPlan({ plan, readOnly = false }: { plan: Plan; readOnly?: boolean }) {
  const completed = plan.jri.filter(
    (row) => row.status === 'completed' || row.status === 'passed',
  ).length;
  const nextModule = JOB_READY_MODULES.find(
    (module) =>
      !plan.jri.some(
        (row) => row.scorm_package_id === module.id && ['completed', 'passed'].includes(row.status),
      ),
  );
  const steps = [
    {
      title: 'My credential',
      description: plan.credentialEarned
        ? 'Your earned credential is recorded. Review your records.'
        : plan.credentialUnavailable
          ? 'Credential status is temporarily unavailable. Open your records.'
          : 'Submit your earned credential for staff review.',
      label: plan.credentialEarned ? 'Credential recorded' : 'View credential records',
      href: '/lms/certification/upload',
      icon: Award,
    },
    {
      title: 'My résumé',
      description: plan.resumeUnavailable
        ? 'Résumé status is temporarily unavailable.'
        : plan.resumeSaved
          ? 'A résumé is saved. Update it with your latest training and credential.'
          : 'Build a résumé with your training, skills, and experience.',
      label: plan.resumeSaved ? 'Update résumé' : 'Build résumé',
      href: '/lms/resume-builder',
      icon: FileText,
    },
    {
      title: 'Job Ready Indy',
      description: plan.jriUnavailable
        ? 'Saved progress is temporarily unavailable.'
        : `${completed} of ${JOB_READY_MODULES.length} learner modules complete. Continue from your saved place.`,
      label: completed === JOB_READY_MODULES.length ? 'Review Job Ready' : 'Open Job Ready',
      href: '/lms/career/job-ready',
      icon: BookOpen,
    },
    {
      title: 'Interviews & support',
      description: 'Practice your answers and get help from Career Services.',
      label: 'Prepare for interviews',
      href: '/lms/career/job-ready#interview-practice',
      icon: MessageSquare,
    },
    {
      title: 'Find work',
      description: 'Explore current openings and connect with placement support.',
      label: 'Explore opportunities',
      href: '/lms/career',
      icon: Briefcase,
    },
  ];
  const next = !plan.resumeSaved
    ? { href: '/lms/resume-builder', label: 'Build my résumé' }
    : nextModule
      ? { href: '/lms/career/job-ready', label: 'Continue Job Ready' }
      : { href: '/lms/career', label: 'Explore job opportunities' };
  return (
    <section
      aria-labelledby="career-plan-title"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="grid sm:grid-cols-[1fr_220px]">
        <div className="space-y-3 bg-amber-50 p-5 sm:p-6">
          <p className="font-bold text-amber-950">Your next chapter</p>
          <h2 id="career-plan-title" className="text-2xl font-bold text-slate-950">
            Your Career Plan
          </h2>
          <p className="max-w-2xl leading-7 text-slate-800">
            {plan.credentialEarned
              ? 'You earned your credential. Let’s prepare for your next opportunity.'
              : 'Start preparing for work while you train. Your career plan stays available after graduation.'}
          </p>
          {readOnly ? (
            <p className="font-semibold text-amber-950">
              Read-only learner preview. Open the learner account to use these tools.
            </p>
          ) : (
            <Link
              href={next.href}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
            >
              {next.label}
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          )}
        </div>
        <div className="relative hidden min-h-48 sm:block">
          <Image
            src="/images/pages/resume-building-hero.webp"
            alt="Career preparation and guidance"
            fill
            sizes="220px"
            className="object-cover"
          />
        </div>
      </div>
      <ol className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map(({ title, description, label, href, icon: Icon }, index) => (
          <li key={title} className="flex min-w-0 flex-col rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-amber-800" />
              <h3 className="text-lg font-bold text-slate-950">
                {index + 1}. {title}
              </h3>
            </div>
            <p className="mb-3 mt-3 flex-1 leading-7 text-slate-700">{description}</p>
            {readOnly ? (
              <span className="font-semibold text-slate-600">{label}</span>
            ) : (
              <Link
                href={href}
                className="inline-flex min-h-12 items-center gap-2 font-bold text-slate-950 underline underline-offset-4"
              >
                {label}
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
