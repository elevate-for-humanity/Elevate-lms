import Link from 'next/link';
import { BriefcaseBusiness, CheckCircle2, ClipboardCheck, GraduationCap, WalletCards } from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';

const APPRENTICESHIP_SLUGS = new Set([
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'esthetician',
  'nail-technician-apprenticeship',
  'youth-culinary-apprenticeship',
]);

export default function ProgramExperienceGuide({ program }: { program: ProgramSchema }) {
  const isApprenticeship =
    program.programType === 'apprenticeship' || APPRENTICESHIP_SLUGS.has(program.slug);
  const paymentPlanHref = `/apply/student?${new URLSearchParams({
    program: program.slug,
    intent: 'enrollment',
    funding: 'self_pay',
    payment: 'bnpl',
  }).toString()}`;

  const steps = isApprenticeship
    ? [
        {
          icon: ClipboardCheck,
          title: '1. Apply and review',
          body: 'Choose the occupation, submit the application, and review eligibility, tuition, documents, and scheduling with Elevate.',
        },
        {
          icon: BriefcaseBusiness,
          title: '2. Confirm a Host Site',
          body: 'A qualified employer provides paid work, licensed supervision, and hands-on training. Placement depends on approval and current capacity.',
        },
        {
          icon: GraduationCap,
          title: '3. Train and complete instruction',
          body: 'Complete supervised on-the-job learning and Related Technical Instruction while hours, competencies, attendance, and documents are recorded.',
        },
        {
          icon: CheckCircle2,
          title: '4. Finish the pathway',
          body: 'Complete required hours and competencies, resolve program balances, and follow the applicable testing or licensing process.',
        },
      ]
    : [
        {
          icon: ClipboardCheck,
          title: '1. Apply and review',
          body: 'Choose the program, submit the application, and review eligibility, tuition, documents, schedule, and delivery format.',
        },
        {
          icon: GraduationCap,
          title: '2. Complete training',
          body: 'Work through lessons, hands-on activities, attendance requirements, assessments, and required documentation.',
        },
        {
          icon: CheckCircle2,
          title: '3. Complete the credential path',
          body: 'Finish program requirements and follow the applicable certification, testing, or completion process.',
        },
      ];

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-12 sm:py-16" aria-labelledby={`${program.slug}-guide`}>
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
          {program.title} — program guide
        </p>
        <h2 id={`${program.slug}-guide`} className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          How this program works from application to completion
        </h2>
        <p className="mt-4 max-w-4xl text-base font-medium leading-7 text-slate-700 sm:text-lg">
          This is the complete enrollment flow. Follow the steps in order so you know who is responsible, when payment is selected, and what must be completed.
        </p>

        <div className={`mt-8 grid gap-4 ${steps.length === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
          {steps.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <Icon className="h-7 w-7 text-brand-blue-700" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <WalletCards className="h-7 w-7 text-brand-blue-800" aria-hidden="true" />
              <h3 className="text-2xl font-black text-slate-950">How self-pay and BNPL work</h3>
            </div>
            <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-slate-700 sm:text-base">
              Apply first. After your program and enrollment details are confirmed, choose full payment or an available payment plan. BNPL means “buy now, pay later”: an outside payment provider reviews your application, shows its own terms, and decides approval. Approval is not guaranteed. Review the payment amount, due dates, fees, and provider agreement before accepting. Workforce funding is a separate process and requires written authorization from the responsible agency.
            </p>
            {isApprenticeship ? (
              <p className="mt-3 text-sm font-bold leading-6 text-slate-800">
                The Host Site employs, pays, and supervises the apprentice. Tuition is paid through Elevate’s approved enrollment checkout—not to the Host Site.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            <Link href={paymentPlanHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue-700 px-6 py-3 text-center font-black text-white hover:bg-brand-blue-800">
              Review payment options
            </Link>
            <Link href={program.cta.applyHref || `/apply?program=${program.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-6 py-3 text-center font-black text-slate-950 hover:bg-slate-50">
              Start application
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
