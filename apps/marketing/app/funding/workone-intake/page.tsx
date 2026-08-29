import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react';

import StudentApplicationForm from '@/apps/marketing/app/apply/student/StudentApplicationForm';

const WORKONE_ORIENTATION_URL =
  'https://workoneindy.as.me/schedule/e8f310c0/appointment/91381838/calendar/9483996?calendarIds=9483996';

export const metadata: Metadata = {
  title: 'WorkOne Funding Intake,
  description:
    'Complete your Elevate funding intake, schedule your WorkOne orientation, and keep your workforce-funding progress connected to your application.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/workone-intake',
  },
};

export default function WorkOneFundingIntakePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-800 bg-slate-950 px-4 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-300">
            Workforce Funding Intake
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
            Start your funding intake and keep every WorkOne step connected to your application.
          </h1>
          <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-slate-200 sm:text-lg">
            Complete the intake below and select WIOA or Workforce Ready Grant when applicable. Your application becomes the controlling record for funding follow-up, WorkOne progress, documents, and enrollment review.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={WORKONE_ORIENTATION_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600"
            >
              <CalendarDays className="h-5 w-5" /> Schedule Your WorkOne Orientation for Funding
            </a>
            <Link
              href="/apply/track"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-6 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Track an Existing Application
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ClipboardList className="h-6 w-6 text-brand-red-700" />
            <h2 className="mt-3 font-black">1. Complete intake</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Choose your program and funding source so your funding path is attached to the correct application.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CalendarDays className="h-6 w-6 text-brand-red-700" />
            <h2 className="mt-3 font-black">2. Schedule WorkOne</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Use the official WorkOne Indianapolis orientation link and keep your appointment information.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CheckCircle2 className="h-6 w-6 text-brand-red-700" />
            <h2 className="mt-3 font-black">3. Update progress</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Funded applications receive the existing WorkOne handoff and private progress workflow for appointment, submission, approval, or help-needed updates.</p>
          </article>
        </div>
      </section>

      <section id="funding-intake-form" className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-widest text-brand-red-700">Tracked Intake Form</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Complete your Elevate application and funding intake.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              If you are seeking WorkOne funding, choose WIOA in the Funding step. If you are using Indiana Workforce Ready Grant, choose that option instead. Funding is not approved until the responsible agency issues authorization.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
            <StudentApplicationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
