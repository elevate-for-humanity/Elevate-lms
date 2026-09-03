'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

type Goal =
  | 'business'
  | 'website'
  | 'course'
  | 'community'
  | 'customers'
  | 'grants'
  | 'government'
  | 'workforce'
  | 'apprenticeship';

type OrgType =
  | 'solo'
  | 'small-business'
  | 'training-provider'
  | 'nonprofit'
  | 'employer'
  | 'agency';

type Recommendation = {
  key: string;
  name: string;
  reason: string;
  href: string;
  demoHref: string;
  badge?: string;
};

const GOALS: Array<{ id: Goal; label: string }> = [
  { id: 'business', label: 'Start or grow a business' },
  { id: 'website', label: 'Build a website' },
  { id: 'course', label: 'Create and sell training' },
  { id: 'community', label: 'Build a community' },
  { id: 'customers', label: 'Manage leads and customers' },
  { id: 'grants', label: 'Find and manage grants' },
  { id: 'government', label: 'Manage SAM.gov / contracting' },
  { id: 'workforce', label: 'Run workforce programs' },
  { id: 'apprenticeship', label: 'Run an apprenticeship' },
];

const ORGS: Array<{ id: OrgType; label: string }> = [
  { id: 'solo', label: 'Just me' },
  { id: 'small-business', label: 'Small business' },
  { id: 'training-provider', label: 'Training provider / school' },
  { id: 'nonprofit', label: 'Nonprofit' },
  { id: 'employer', label: 'Employer' },
  { id: 'agency', label: 'Workforce or government agency' },
];

function recommend(goal: Goal, org: OrgType): Recommendation[] {
  const common: Recommendation[] = [];
  if (goal === 'business' || goal === 'website') {
    common.push({
      key: 'website_builder',
      name: 'AI Website Builder',
      reason: 'Create, edit, preview and publish a business website without code.',
      href: '/store/apps/website-builder',
      demoHref: '/store/demo/website',
      badge: 'Start here',
    });
    common.push({
      key: 'crm',
      name: 'CRM',
      reason: 'Capture leads and keep customer follow-up connected to your website.',
      href: '/store#marketplace',
      demoHref: '/store/demo/crm',
    });
    common.push({
      key: 'ai_paris',
      name: 'AI Assistant',
      reason: 'Automate routine questions, follow-up and business support.',
      href: '/store#marketplace',
      demoHref: '/store/demo/ai-studio',
    });
  }
  if (goal === 'course') {
    common.push({
      key: 'course_builder',
      name: 'Course Builder',
      reason:
        'Describe the course and let AI create the starting structure, lessons and assessments.',
      href: '/store#marketplace',
      demoHref: '/store/demo/ai-studio',
      badge: 'Best match',
    });
    common.push({
      key: 'lms',
      name: 'LMS',
      reason: 'Deliver training, track progress and manage learners.',
      href: '/store#marketplace',
      demoHref: '/store/demo/lms',
    });
  }
  if (goal === 'community') {
    common.push({
      key: 'community',
      name: 'Community Hub',
      reason: 'Launch groups, discussions, events, achievements and member engagement.',
      href: '/store#marketplace',
      demoHref: '/store/demo/community',
      badge: 'Best match',
    });
    common.push({
      key: 'ai_orchestrator',
      name: 'AI Team',
      reason: 'Add guided onboarding, support and engagement assistance.',
      href: '/store#marketplace',
      demoHref: '/store/demo/ai-studio',
    });
  }
  if (goal === 'customers') {
    common.push({
      key: 'crm',
      name: 'CRM',
      reason: 'Create a customer pipeline, follow-up process and shared record of activity.',
      href: '/store#marketplace',
      demoHref: '/store/demo/crm',
      badge: 'Best match',
    });
    common.push({
      key: 'ai_paris',
      name: 'AI Assistant',
      reason: 'Reduce manual follow-up and repetitive customer questions.',
      href: '/store#marketplace',
      demoHref: '/store/demo/ai-studio',
    });
  }
  if (goal === 'grants') {
    common.push({
      key: 'grants_discovery',
      name: 'Grants Discovery',
      reason: 'Search, match and track funding opportunities from one workspace.',
      href: '/store/apps/grants',
      demoHref: '/store/demo/admin',
      badge: 'Best match',
    });
  }
  if (goal === 'government') {
    common.push({
      key: 'sam_gov_manager',
      name: 'SAM.gov Manager',
      reason: 'Use a guided workflow for registration, renewals and compliance tracking.',
      href: '/store/apps/sam-gov',
      demoHref: '/store/demo/admin',
      badge: 'Best match',
    });
  }
  if (goal === 'workforce') {
    common.push({
      key: 'workforce',
      name: 'Workforce OS',
      reason: 'Manage enrollment, funding, compliance, outcomes and agency workflows.',
      href: '/store#marketplace',
      demoHref: '/store/demo/institutional',
      badge: 'Best match',
    });
  }
  if (goal === 'apprenticeship') {
    common.push({
      key: 'apprenticeship',
      name: 'Apprenticeship Management',
      reason: 'Track RTI, OJT, employers, progress and compliance in one workflow.',
      href: '/store#marketplace',
      demoHref: '/store/demo/employer',
      badge: 'Best match',
    });
  }
  if (
    (org === 'training-provider' || org === 'agency') &&
    !common.some((item) => item.key === 'lms')
  ) {
    common.push({
      key: 'lms',
      name: 'LMS',
      reason:
        'Add learner delivery, progress and training records when your organization needs them.',
      href: '/store#marketplace',
      demoHref: '/store/demo/lms',
    });
  }
  return common.slice(0, 4);
}

export function GuidedProductInterview() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [org, setOrg] = useState<OrgType | null>(null);
  const recommendations = useMemo(() => (goal && org ? recommend(goal, org) : []), [goal, org]);
  const guidedTrialHref = useMemo(() => {
    if (!goal || !org || recommendations.length === 0) return '/store/trial';
    const params = new URLSearchParams({
      recommended: recommendations.map((item) => item.key).join(','),
      goal,
      org,
    });
    return `/store/trial?${params.toString()}`;
  }, [goal, org, recommendations]);

  return (
    <section className="bg-white py-16" id="guided-setup">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-red-50 px-4 py-2 text-sm font-black text-brand-red-700">
            <Sparkles className="h-4 w-4" /> Zero-code guided setup
          </span>
          <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">
            Tell Elevate what you want to accomplish.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            You do not need to understand product names or technical settings. Answer two questions
            and Elevate will recommend the simplest starting stack.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-slate-500">
              1. What are you trying to do?
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {GOALS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${goal === item.id ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-800' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-7 text-sm font-black uppercase tracking-wider text-slate-500">
              2. Who is this for?
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {ORGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOrg(item.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${org === item.id ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-800' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-brand-red-300">
              Your recommended setup
            </p>
            {goal && org ? (
              <div className="mt-4 rounded-xl border border-brand-red-400/30 bg-brand-red-500/10 p-4 text-sm text-white">
                <span className="font-black">You selected:</span>{' '}
                {GOALS.find((item) => item.id === goal)?.label} for{' '}
                {ORGS.find((item) => item.id === org)?.label.toLowerCase()}.
              </div>
            ) : null}
            {!goal || !org ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-100">
                Choose a goal and organization type. Elevate will explain what to start with and
                why.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {recommendations.map((item) => (
                  <article
                    key={item.key}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black">{item.name}</h3>
                          {item.badge ? (
                            <span className="rounded-full bg-brand-red-600 px-2 py-1 text-[11px] font-black uppercase">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-100">{item.reason}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <Link
                        href={item.demoHref}
                        className="inline-flex items-center gap-2 text-sm font-black text-white"
                      >
                        Play live demo <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={item.href}
                        className="text-sm font-bold text-slate-300 hover:text-white"
                      >
                        Product details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {goal && org ? (
              <div className="mt-6 rounded-2xl bg-white p-5 text-slate-950">
                <p className="font-black">Keep these recommendations.</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Your recommended capabilities will be carried into the trial workspace instead of
                  making you choose them again.
                </p>
                <Link
                  href={guidedTrialHref}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-4 py-3 text-sm font-black text-white"
                >
                  Start guided trial <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
