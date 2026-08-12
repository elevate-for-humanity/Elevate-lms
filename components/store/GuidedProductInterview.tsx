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

type OrgType = 'solo' | 'small-business' | 'training-provider' | 'nonprofit' | 'employer' | 'agency';

type Recommendation = {
  name: string;
  reason: string;
  href: string;
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
  const matches: Recommendation[] = [];

  if (goal === 'business' || goal === 'website') {
    matches.push({
      name: 'AI Website Builder',
      reason: 'Create, edit, preview and publish a business website without code.',
      href: '/store/apps/website-builder',
      badge: 'Start here',
    });
    matches.push({
      name: 'CRM',
      reason: 'Capture leads and keep customer follow-up connected to your website.',
      href: '/store#marketplace',
    });
    matches.push({
      name: 'AI Assistant',
      reason: 'Automate routine questions, follow-up and business support.',
      href: '/store#marketplace',
    });
  }

  if (goal === 'course') {
    matches.push({
      name: 'Course Builder',
      reason: 'Describe the course and let AI create the starting structure, lessons and assessments.',
      href: '/store#marketplace',
      badge: 'Best match',
    });
    matches.push({
      name: 'LMS',
      reason: 'Deliver training, track progress and manage learners.',
      href: '/store#marketplace',
    });
  }

  if (goal === 'community') {
    matches.push({
      name: 'Community Hub',
      reason: 'Launch groups, discussions, events, achievements and member engagement.',
      href: '/store#marketplace',
      badge: 'Best match',
    });
    matches.push({
      name: 'AI Team',
      reason: 'Add guided onboarding, support and engagement assistance.',
      href: '/store#marketplace',
    });
  }

  if (goal === 'customers') {
    matches.push({
      name: 'CRM',
      reason: 'Create a customer pipeline, follow-up process and shared record of activity.',
      href: '/store#marketplace',
      badge: 'Best match',
    });
    matches.push({
      name: 'AI Assistant',
      reason: 'Reduce manual follow-up and repetitive customer questions.',
      href: '/store#marketplace',
    });
  }

  if (goal === 'grants') {
    matches.push({
      name: 'Grants Discovery',
      reason: 'Search, match and track funding opportunities from one workspace.',
      href: '/store/apps/grants',
      badge: 'Best match',
    });
  }

  if (goal === 'government') {
    matches.push({
      name: 'SAM.gov Manager',
      reason: 'Use a guided workflow for registration, renewals and compliance tracking.',
      href: '/store/apps/sam-gov',
      badge: 'Best match',
    });
  }

  if (goal === 'workforce') {
    matches.push({
      name: 'Workforce OS',
      reason: 'Manage enrollment, funding, compliance, outcomes and agency workflows.',
      href: '/store#marketplace',
      badge: 'Best match',
    });
  }

  if (goal === 'apprenticeship') {
    matches.push({
      name: 'Apprenticeship Management',
      reason: 'Track RTI, OJT, employers, progress and compliance in one workflow.',
      href: '/store#marketplace',
      badge: 'Best match',
    });
  }

  if ((org === 'training-provider' || org === 'agency') && !matches.some((item) => item.name === 'LMS')) {
    matches.push({
      name: 'LMS',
      reason: 'Add learner delivery, progress and training records when your organization needs them.',
      href: '/store#marketplace',
    });
  }

  return matches.slice(0, 4);
}

export function GuidedProductInterview() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [org, setOrg] = useState<OrgType | null>(null);
  const recommendations = useMemo(() => (goal && org ? recommend(goal, org) : []), [goal, org]);

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
            You do not need to understand product names or technical settings. Answer two questions and Elevate will recommend the simplest starting stack.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-slate-500">1. What are you trying to do?</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {GOALS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                    goal === item.id
                      ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-800'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mt-7 text-sm font-black uppercase tracking-wider text-slate-500">2. Who is this for?</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {ORGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOrg(item.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                    org === item.id
                      ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-800'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
            <p className="text-sm font-black uppercase tracking-wider text-brand-red-300">Your recommended setup</p>
            {!goal || !org ? (
              <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-6 text-slate-100">
                Choose a goal and organization type. Elevate will explain what to start with and why.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {recommendations.map((item) => (
                  <article key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.reason}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    </div>
                    <Link href={item.href} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-white">
                      See this product <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {goal && org ? (
              <div className="mt-6 rounded-2xl bg-white p-5 text-slate-950">
                <p className="font-black">Simple mode first.</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Elevate guides setup in plain English. Advanced controls stay optional until the customer needs them.
                </p>
                <Link
                  href="/store/trial"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-4 py-3 text-sm font-black text-white"
                >
                  Start guided setup <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
