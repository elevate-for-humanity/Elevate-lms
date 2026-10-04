import Link from 'next/link';
import { BriefcaseBusiness, CheckCircle2, ClipboardCheck, GraduationCap, WalletCards } from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { MobileDisclosure } from '@/components/ui/MobileDisclosure';

const APPRENTICESHIP_SLUGS = new Set(['barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'esthetician', 'nail-technician-apprenticeship', 'youth-culinary-apprenticeship']);

export default function ProgramExperienceGuide({ program }: { program: ProgramSchema }) {
  const isApprenticeship = program.programType === 'apprenticeship' || APPRENTICESHIP_SLUGS.has(program.slug);
  const paymentPlanHref = `/apply/student?${new URLSearchParams({ program: program.slug, intent: 'enrollment', funding: 'self_pay', payment: 'bnpl' }).toString()}`;
  const steps = isApprenticeship ? [
    { icon: ClipboardCheck, title: '1. Apply and review', body: 'Choose the occupation, submit the application, and review eligibility, tuition, documents, and scheduling with Elevate.' },
    { icon: BriefcaseBusiness, title: '2. Confirm a Host Site', body: 'A qualified employer provides paid work, licensed supervision, and hands-on training. Placement depends on approval and current capacity.' },
    { icon: GraduationCap, title: '3. Train and complete instruction', body: 'Complete supervised on-the-job learning and Related Technical Instruction while hours, competencies, attendance, and documents are recorded.' },
    { icon: CheckCircle2, title: '4. Finish the pathway', body: 'Complete required hours and competencies, resolve program balances, and follow the applicable testing or licensing process.' },
  ] : [
    { icon: ClipboardCheck, title: '1. Apply and review', body: 'Choose the program, submit the application, and review eligibility, tuition, documents, schedule, and delivery format.' },
    { icon: GraduationCap, title: '2. Complete training', body: 'Work through lessons, hands-on activities, attendance requirements, assessments, and required documentation.' },
    { icon: CheckCircle2, title: '3. Complete the credential path', body: 'Finish program requirements and follow the applicable certification, testing, or completion process.' },
  ];

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-8 sm:py-12" aria-labelledby={`${program.slug}-guide`}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red-700">Program guide</p>
        <h2 id={`${program.slug}-guide`} className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Your steps to completion.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">Open a step for details.</p>
        <div className={`mt-5 grid items-start gap-3 ${steps.length === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
          {steps.map(({ icon: Icon, title, body }) => <MobileDisclosure key={title} title={title} icon={<Icon className="h-6 w-6" />}><p>{body}</p></MobileDisclosure>)}
        </div>
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
          <div className="flex items-center gap-3"><WalletCards className="h-6 w-6 shrink-0 text-brand-blue-800" aria-hidden="true" /><h3 className="text-xl font-bold text-slate-950">Paying for training</h3></div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">Apply first. Once enrollment details are confirmed, review full payment or an available plan. An outside provider decides buy now, pay later (BNPL) approval; approval is not guaranteed.</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">Review amounts, due dates, fees and the provider agreement before accepting. Workforce funding is separate and requires written agency authorization.</p>
          {isApprenticeship ? <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-800">The Host Site employs, pays and supervises the apprentice. Tuition goes through Elevate’s approved checkout, not the Host Site.</p> : null}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href={paymentPlanHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue-700 px-5 py-3 text-center font-bold text-white hover:bg-brand-blue-800">Review payment options</Link>
            <Link href={program.cta.applyHref || `/apply?program=${program.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-center font-bold text-slate-950 hover:bg-slate-50">Start application</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
