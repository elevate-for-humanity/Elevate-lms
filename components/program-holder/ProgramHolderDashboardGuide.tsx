'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';

const steps = [
  { title: 'Verify your identity and organization', href: '/program-holder/dashboard', purpose: 'The name, profile photo, organization, account status, and assigned program summary must belong to you. Stop and report a mismatch before opening student records.', action: 'Confirm your photo, name, organization, and status in the dashboard hero and navigation.' },
  { title: 'Understand the command center', href: '/program-holder/dashboard', purpose: 'The dashboard summarizes applicants, enrolled students, required actions, compliance, programs, phone, email, community, career support, and payment readiness.', action: 'Review each metric and open every required-action card.' },
  { title: 'Work the applicant queue', href: '/program-holder/students/pending', purpose: 'Applicants are people routed to you because their selected program matches one of your active program assignments. They are not confirmed students yet.', action: 'Call each new applicant, record the outcome and notes, and set the next follow-up date.' },
  { title: 'Confirm funding or self-pay', href: '/program-holder/programs', purpose: 'Funding is never assumed. A learner is funded only after written authorization or a verified voucher is present. Otherwise explain the published self-pay amount.', action: 'Compare the applicant record with the program amount and funding path before quoting a price.' },
  { title: 'Explain payment options', href: '/program-holder/programs', purpose: 'Students may use the checkout methods Elevate makes available. Eligible self-pay applicants can request a buy-now-pay-later decision, including Affirm when it is shown. Provider approval is not guaranteed.', action: 'Explain the total amount, what is due now, and that BNPL approval comes from the payment provider.' },
  { title: 'Review enrolled students', href: '/program-holder/students', purpose: 'Only confirmed enrollments belong on the student roster. This is where you monitor active learners, progress, start dates, completion, and required follow-up.', action: 'Verify every enrolled learner belongs to one of your assigned programs.' },
  { title: 'Respond to at-risk learners', href: '/program-holder/students/at-risk', purpose: 'The at-risk view is a focused list of enrolled learners whose records show an engagement, progress, attendance, or completion concern.', action: 'Contact each at-risk learner and document the intervention.' },
  { title: 'Review assigned programs', href: '/program-holder/programs', purpose: 'Program cards show your approved ownership, published amount, funding path, credential, hours, and connected course assignments.', action: 'Report any wrong program, missing amount, or missing course assignment.' },
  { title: 'Record training hours', href: '/program-holder/hours', purpose: 'Enter actual training dates, hours, work completed, and evidence. Never estimate, duplicate, or backdate records.', action: 'Submit the next verified training entry and confirm it appears in the log.' },
  { title: 'Use meetings and screen share', href: '/program-holder/meetings', purpose: 'Schedule phone, video, or in-person meetings. When a live room is active, use its camera, microphone, chat, and screen-share controls.', action: 'Review upcoming meetings and test permissions before a live appointment.' },
  { title: 'Install the Program Holder app', href: '/install', purpose: 'Install the PWA from your browser so the dashboard, phone, and notifications are available like an app. Use Add to Home Screen on iPhone/iPad or Install app on Chrome/Android.', action: 'Install the app and sign in from the new home-screen icon.' },
  { title: 'Connect your dashboard phone', href: '/program-holder/phone', purpose: 'The phone uses your assigned extension. Choose Ring, Vibrate, Silent, Do Not Disturb, or Off; set work hours; allow microphone and notification permissions; then select Connect phone.', action: 'Confirm the displayed name, department, extension, and available phone controls belong to you.' },
  { title: 'Place and return calls', href: '/program-holder/phone', purpose: 'Use the in-app dialer or an applicant call action. Keep the app connected for inbound calls, and use missed-call tasks to return calls and record outcomes.', action: 'Open the dialer and verify it is ready without placing an unapproved test call.' },
  { title: 'Use AirScript', href: '/program-holder/airscript', purpose: 'AirScript provides approved openings, voicemail wording, funding language, and a post-call checklist so outreach stays consistent and auditable.', action: 'Open the script beside the applicant record before calling.' },
  { title: 'Use your office email', href: '/program-holder/email', purpose: 'Send and receive official program communication through the Elevate mailbox assigned to your profile. Do not use another holder’s mailbox or your personal account for student records.', action: 'Confirm the From address belongs to you before drafting a message.' },
  { title: 'Use Office Mail', href: '/program-holder/inbox', purpose: 'Office Mail is for private, auditable communication with Elevate staff. It is separate from student-facing email.', action: 'Review the available internal recipients and existing threads.' },
  { title: 'Use Community and Career Feed', href: '/program-holder/community', purpose: 'The role-safe Community hub connects you to meetings, staff, and support. Career Feed shows opportunities you may share with learners and document in outcome reports.', action: 'Open both areas and identify the correct next action for one learner.' },
  { title: 'Manage documents', href: '/program-holder/documents', purpose: 'Upload only records required by your program and agreement. Keep registration, insurance, W-9, credentials, releases, and program evidence current.', action: 'Separate incomplete items you own from administrator-owned setup.' },
  { title: 'Read compliance correctly', href: '/program-holder/compliance', purpose: 'Compliance measures applicable requirements and evidence. Each item identifies whether the Program Holder, Elevate, or both parties own the next action.', action: 'Resolve every incomplete item assigned to the Program Holder.' },
  { title: 'Review agreements', href: '/program-holder/sign-mou', purpose: 'Read the actual agreement assigned to your organization, including scope, responsibilities, compensation, privacy, and termination terms.', action: 'Confirm the displayed agreement is your organization’s version.' },
  { title: 'Submit reports and outcomes', href: '/program-holder/reports', purpose: 'Use reports for enrollment, progress, completion, credentials, placement, and closeout records tied to your assigned programs.', action: 'Review the current reporting period and submit only verified data.' },
  { title: 'Understand payouts', href: '/program-holder/payouts', purpose: 'Payout readiness depends on the signed agreement, verified milestones, complete evidence, compliance, and receipt of applicable funding. A lead alone does not trigger payment.', action: 'Review the payout method, schedule, blockers, and completed milestones.' },
  { title: 'Use PARIS as your assistant', href: '/program-holder/dashboard', purpose: 'Ask PARIS to explain a page, open the correct workspace, summarize next actions, prepare a draft, or identify missing records. You must review facts before anything is sent or submitted.', action: 'Ask PARIS: “Show me today’s applicants and what I need to document after each call.”' },
];

export function ProgramHolderDashboardGuide() {
  const [index, setIndex] = useState(0);
  const step = steps[index];

  return (
    <section className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Personalized dashboard orientation</p>
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
