'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';

const steps = [
  { title: 'Dashboard', href: '/program-holder/dashboard', purpose: 'See urgent actions, compliance readiness, student activity, and payout status.' },
  { title: 'Students', href: '/program-holder/students', purpose: 'Review assigned learners, contact them only for approved program activity, and monitor progress.' },
  { title: 'Pending', href: '/program-holder/students/pending', purpose: 'Work the approved applicant queue and document outreach outcomes.' },
  { title: 'Grades', href: '/program-holder/grades', purpose: 'Review learning performance and identify students who need support.' },
  { title: 'Create Course', href: '/program-holder/courses/create', purpose: 'Build approved training content without changing compliance requirements.' },
  { title: 'Documents', href: '/program-holder/documents', purpose: 'Upload IDs, insurance, credentials, W-9 records, student evidence, and other required files.' },
  { title: 'Verification', href: '/program-holder/verification', purpose: 'Check whether organizational and instructor requirements are approved.' },
  { title: 'Compliance', href: '/program-holder/compliance', purpose: 'Resolve missing requirements before they delay training or payment.' },
  { title: 'MOU', href: '/program-holder/mou', purpose: 'Review the partnership terms, responsibilities, payment model, and signed agreement.' },
  { title: 'Reports', href: '/program-holder/reports', purpose: 'Submit and review enrollment, progress, completion, and outcome records.' },
  { title: 'Campaigns', href: '/program-holder/campaigns', purpose: 'Manage approved outreach. Paris confirms acceptance and provider-backed delivery events when configured.' },
  { title: 'Notifications', href: '/program-holder/notifications', purpose: 'Review account and program alerts.' },
  { title: 'Settings', href: '/program-holder/settings', purpose: 'Manage profile information and choose email or text notification channels.' },
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
