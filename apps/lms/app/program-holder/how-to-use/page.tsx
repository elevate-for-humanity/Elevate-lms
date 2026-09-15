import Image from 'next/image';
import Link from 'next/link';
import { Bot, CheckCircle2, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';
import { ProgramHolderDashboardGuide } from '@/components/program-holder/ProgramHolderDashboardGuide';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Start Here | Program Holder Portal',
  description: 'Program Holder orientation, dashboard walkthrough, responsibilities, and payment-readiness guide.',
};

const responsibilities = [
  'Provide a safe, professional training environment and qualified day-to-day supervision.',
  'Deliver the approved curriculum and hands-on training consistently.',
  'Record attendance, training hours, progress updates, case notes, and follow-up information on time.',
  'Report safety, participation, eligibility, or engagement concerns promptly.',
  'Protect student information and use it only for approved training activity.',
  'Keep business registration, insurance, W-9, credentials, and required agreements current.',
];

const paymentRequirements = [
  'The student must be officially enrolled, funded, and started in the approved program.',
  'Payment 1 requires verified enrollment and documented completion of the 50% training milestone.',
  'Payment 2 requires completed training, final hours, practical-skills verification, credential issuance, and final approval.',
  'Elevate must receive and reconcile the funding before a Program Holder payment can be released.',
  'Missing documents, unverified hours, incomplete closeout records, or compliance concerns can delay payment.',
];

export default function ProgramHolderStartHerePage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        <div className="grid lg:grid-cols-[360px_1fr]">
          <div className="relative min-h-[360px] bg-slate-900">
            <Image
              src="/images/team/elizabeth-greene-headshot.webp"
              alt="Elizabeth Greene, Founder and Chief Executive Officer"
              fill
              priority
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover object-top"
            />
          </div>
          <div className="p-6 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Welcome from Elizabeth Greene</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Welcome to the Program Holder Portal</h1>
            <div className="mt-5 space-y-4 text-base leading-7 text-slate-200">
              <p>
                Welcome to Elevate for Humanity. This partnership gives you the systems, compliance support,
                student pipeline, reporting tools, and workforce connections needed to deliver strong training.
              </p>
              <p>
                My expectation is that every student is treated professionally, trained safely, supported consistently,
                and documented accurately. Your dashboard is the official workspace for student activity, evidence,
                compliance, and payment readiness.
              </p>
              <p>
                Paris is here to help you understand the platform, prepare communications, organize follow-up,
                and identify missing work. You remain responsible for reviewing communications and verifying that
                attendance, hours, progress, credentials, and student records are correct.
              </p>
            </div>
            <p className="mt-5 text-sm font-bold text-white">— Elizabeth Greene, Founder &amp; Chief Executive Officer</p>
            <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
              The approved talking-avatar video will appear here when its original media file is restored. This written
              welcome remains available as the accessible transcript.
            </p>
          </div>
        </div>
      </section>

      <ProgramHolderDashboardGuide />

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
          <Bot className="h-8 w-8 text-violet-700" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">Advantages of Paris</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li><strong>Guidance:</strong> explains each dashboard area and the next required action.</li>
            <li><strong>Communication:</strong> prepares approved emails and texts and records provider status.</li>
            <li><strong>Follow-up:</strong> helps organize student reminders, outreach, and unresolved tasks.</li>
            <li><strong>Readiness:</strong> points out missing documentation that can affect compliance or payment.</li>
            <li><strong>Consistency:</strong> helps Program Holders follow the same documented workflow.</li>
          </ul>
          <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">
            Paris assists with the work. Paris does not replace your professional judgment, student supervision,
            record verification, or responsibility for submitted information.
          </div>
        </article>

        <article className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <ShieldCheck className="h-8 w-8 text-blue-700" />
          <h2 className="mt-3 text-2xl font-black text-slate-950">Your operating responsibilities</h2>
          <ul className="mt-4 space-y-3">
            {responsibilities.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" /> {item}
              </li>
            ))}
          </ul>
          <Link href="/program-holder/mou" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white">
            Review the complete MOU
          </Link>
        </article>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <DollarSign className="mt-1 h-8 w-8 shrink-0 text-emerald-700" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Payment readiness</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">What must happen before payment</h2>
          </div>
        </div>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {paymentRequirements.map((item, index) => (
            <li key={item} className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
              <strong className="mr-2 text-emerald-800">{index + 1}.</strong>{item}
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/program-holder/compliance" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white">Check compliance</Link>
          <Link href="/program-holder/payouts" className="inline-flex min-h-11 items-center rounded-xl border border-emerald-700 bg-white px-4 text-sm font-black text-emerald-800">Review payouts</Link>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 sm:p-8">
        <Sparkles className="h-8 w-8 text-orange-700" />
        <h2 className="mt-3 text-2xl font-black text-slate-950">Keep this guide available</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          The Reference Library explains every portal tab, what belongs there, and when to use it.
        </p>
        <Link href="/program-holder/documentation" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-orange-700 px-4 text-sm font-black text-white">Open the Reference Library</Link>
      </section>
    </div>
  );
}
