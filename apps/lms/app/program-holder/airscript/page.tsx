import Link from 'next/link';
import Image from 'next/image';
import { ClipboardCheck, MessageSquareText, PhoneCall, ShieldCheck } from 'lucide-react';
import { getProgramHolderWorkspace } from '@/lib/program-holder/workspace';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'AirScript Call Guide',
  description: 'Approved call scripts and documentation workflow for Program Holders.',
};

export default async function ProgramHolderAirScriptPage() {
  const data = await getProgramHolderWorkspace();
  const holderName = data.holder?.organization_name || data.holder?.name || 'your organization';
  const programs = data.programs || [];
  const applicants = data.applicants || [];

  return (
    <main className="space-y-6 px-4 py-6 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        <Image src="/images/pages/admin-email-analytics-detail.webp" alt="Program Holder using Elevate communication tools" fill priority sizes="100vw" className="object-cover" />
        <div className="relative max-w-3xl bg-slate-950/80 p-6 sm:p-9">
        <MessageSquareText className="h-9 w-9 text-cyan-200" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">AirScript service</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Approved student call scripts</h1>
        <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-100 sm:text-base">
          Use these scripts with your dashboard phone. Personalize the student and program names, stay within the verified facts on the record, and save the outcome immediately after the call.
        </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <PhoneCall className="h-7 w-7 text-blue-700" />
          <h2 className="mt-3 text-xl font-black">Live-call opening</h2>
          <p className="mt-2 text-sm text-slate-600">{applicants.length} routed applicant{applicants.length === 1 ? '' : 's'} currently available in your queue. Open an applicant record before calling so the script uses the actual student, program, funding status, and next step.</p>
          <blockquote className="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-7 text-slate-800">
            “Hello, may I speak with [student name]? My name is [your name] with {holderName}, an approved Elevate for Humanity Program Holder. Your application shows interest in [program]. I am calling to confirm your next step, whether your funding has already been approved or the program will be self-pay, and when you are available to begin.”
          </blockquote>
        </article>
        <article className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
          <MessageSquareText className="h-7 w-7 text-violet-700" />
          <h2 className="mt-3 text-xl font-black">Voicemail</h2>
          <blockquote className="mt-4 rounded-xl bg-violet-50 p-4 text-sm leading-7 text-slate-800">
            “Hello [student name], this is [your name] with {holderName} calling about your Elevate for Humanity training application. Please return my call through the number shown on your caller ID. I will also document a follow-up date in your record. Thank you.”
          </blockquote>
        </article>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <ShieldCheck className="h-7 w-7 text-amber-800" />
        <h2 className="mt-3 text-xl font-black text-amber-950">Funding and self-pay language</h2>
        <p className="mt-3 text-sm leading-6 text-amber-950">
          Never promise that funding is approved. Say “funding may be available and must be verified” until the student record contains written authorization or a voucher. If funding is not verified, state the published program amount and explain that the student is responsible for self-payment. Buy-now-pay-later approval belongs to the payment provider.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ClipboardCheck className="h-7 w-7 text-emerald-700" />
        <h2 className="mt-3 text-xl font-black">Your assigned program talking points</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {programs.map((program: any) => (
            <div key={program.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-black">{program.title || program.name}</p>
              <p className="mt-1 text-xs text-slate-600">Confirm the amount and funding status on the Programs page before quoting it.</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/program-holder/phone" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white">Open dashboard phone</Link>
          <Link href="/program-holder/students/pending" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-900">Open applicant queue</Link>
        </div>
      </section>
    </main>
  );
}
