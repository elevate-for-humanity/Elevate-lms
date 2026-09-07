import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardCheck, CalendarDays, FolderUp, MessageCircleQuestion } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Next Steps | Elevate for Humanity',
  description: 'Complete the next steps for funding review, admissions, documents, and enrollment.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/next-steps' },
};

const steps = [
  { icon: ClipboardCheck, title: 'Confirm your application', body: 'Start or complete the canonical student application so admissions has your current program and contact information.', href: '/apply/student', label: 'Open application' },
  { icon: CalendarDays, title: 'Complete funding intake', body: 'If you are pursuing workforce funding, contact WorkOne. Eligibility, available appointments, covered costs, and authorization are determined by the responsible agency.', href: '/funding/wioa', label: 'Review WorkOne steps' },
  { icon: FolderUp, title: 'Finish required documents', body: 'Sign in to your portal to review your checklist, upload requested records, and see which items still need action.', href: 'https://app.elevateforhumanity.org/dashboard', label: 'Open my portal' },
  { icon: MessageCircleQuestion, title: 'Ask for help', body: 'Contact admissions if your program, funding pathway, appointment, or document requirements are unclear.', href: '/contact', label: 'Contact admissions' },
] as const;

export default function NextStepsPage() {
  return <main className="min-h-screen bg-slate-50 px-4 py-14 text-slate-950"><section className="mx-auto max-w-6xl">
    <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Admissions</p>
    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your next steps</h1>
    <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">Use this checklist after applying. Your portal remains the source of truth for your individual status and outstanding requirements.</p>
    <div className="mt-10 grid gap-6 md:grid-cols-2">{steps.map(({icon: Icon, ...step}, index) => <article key={step.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 font-black text-white">{index + 1}</span><Icon className="h-7 w-7 text-brand-red-700" /></div>
      <h2 className="mt-5 text-2xl font-black">{step.title}</h2><p className="mt-3 leading-7 text-slate-700">{step.body}</p>
      <Link href={step.href} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 py-3 font-black text-white">{step.label}</Link>
    </article>)}</div>
  </section></main>;
}
