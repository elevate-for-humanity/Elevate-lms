'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';

const steps = [
  { title: 'Understand your workspace', href: '/program-holder/dashboard', purpose: 'Confirm the organization name, assigned programs, students, account status, and next action shown on your live dashboard.', action: 'Open your dashboard and verify the organization and program names.' },
  { title: 'Review your complete roster', href: '/program-holder/students', purpose: 'See every learner linked to your holder record, including application-backed records that are not active enrollments yet.', action: 'Confirm that each person belongs to one of your assigned programs.' },
  { title: 'Work the applicant queue', href: '/program-holder/students/pending', purpose: 'Record outreach, call outcomes, and follow-up dates for applicants who have not converted to active enrollment.', action: 'Open one applicant and identify the next documented follow-up.' },
  { title: 'Use your approved programs', href: '/program-holder/programs', purpose: 'Review only the programs Elevate assigned to this organization. Course delivery is configured by Elevate when it is part of the agreement.', action: 'Verify that the assigned program list is accurate.' },
  { title: 'Record training evidence', href: '/program-holder/hours', purpose: 'Enter or review training dates, hours, notes, and evidence for learners you supervise. Do not backdate or estimate records.', action: 'Identify where the next training record should be entered.' },
  { title: 'Schedule a team meeting', href: '/program-holder/meetings', purpose: 'Schedule phone, video, or in-person meetings and keep the agenda with the applicant or learner record.', action: 'Review the meeting form and the existing meeting list.' },
  { title: 'Use inter-office mail', href: '/program-holder/inbox', purpose: 'Send private, auditable messages to Elevate staff without using a personal text thread.', action: 'Confirm which Elevate contacts are available in your recipient list.' },
  { title: 'Manage required documents', href: '/program-holder/documents', purpose: 'Upload only the records required by your program and agreement. Recommended branding files do not block access or payment.', action: 'Separate items you must supply from items Elevate must configure.' },
  { title: 'Understand readiness', href: '/program-holder/compliance', purpose: 'Readiness is based on applicable requirements, current evidence, and responsibility. An unavailable integration is never assigned to you as a required task.', action: 'Review every incomplete item and its owner.' },
  { title: 'Review the signed agreement', href: '/program-holder/sign-mou', purpose: 'Read the actual agreement assigned to your organization, including responsibilities and compensation terms.', action: 'Verify that the displayed agreement is the version you signed.' },
  { title: 'Submit program reports', href: '/program-holder/reports', purpose: 'Review enrollment, progress, completion, and outcome records that apply to your assigned programs.', action: 'Confirm the current reporting period and due items.' },
  { title: 'Set up payouts', href: '/program-holder/payouts', purpose: 'Use the payment method configured for your agreement. The dashboard must not require two different payout providers.', action: 'Confirm whether your payout setup is ready or administrator-owned.' },
  { title: 'Ask Paris to act', href: '/program-holder/dashboard', purpose: 'Paris can open the correct workspace, help prepare a draft, and identify the next live record. Official submissions still require your review.', action: 'Ask Paris to open your students, meetings, documents, or reports.' },
];

export function ProgramHolderDashboardGuide() {
  const [index, setIndex] = useState(0);
  const step = steps[index];

  return (
    <section className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Paris dashboard walkthrough</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Step {index + 1} of {steps.length}: {step.title}</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">{Math.round(((index + 1) / steps.length) * 100)}% viewed</span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <p className="text-base leading-7 text-slate-700">{step.purpose}</p>
        <p className="mt-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-bold text-blue-950">Do this now: {step.action}</p>
        <Link href={step.href} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
          Open {step.title} <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Previous</button>
        {index < steps.length - 1 ? (
          <button type="button" onClick={() => setIndex((value) => Math.min(steps.length - 1, value + 1))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white">Next <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <Link href="/program-holder/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"><CheckCircle2 className="h-4 w-4" /> Finish walkthrough</Link>
        )}
      </div>
    </section>
  );
}

export { steps as programHolderGuideSteps };
