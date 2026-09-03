import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle2, Clock3, DollarSign, ShieldCheck, Users } from 'lucide-react';
import { AcknowledgeHandbookButton } from './AcknowledgeHandbookButton';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';

export const metadata: Metadata = {
  title: 'Registered Barber Apprentice Handbook',
  description: 'Registered-program governed apprentice operating guide for the Barber Apprenticeship.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function ApprenticeHandbookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/handbook');
  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  if (programSlug === 'cosmetology-apprenticeship') {
    return <CosmetologyHandbook previewing={subject.previewing} />;
  }
  const contract = getRegisteredProgramStandard(programSlug || 'barber-apprenticeship');
  if (!contract) throw new Error('REGISTERED_BARBER_CONTRACT_MISSING');
  const standard = contract.standard;

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">USDOL Registered Apprenticeship</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Registered Barber Apprentice Handbook</h1><p className="mt-3 max-w-3xl font-medium leading-7 text-slate-700">This handbook is governed by the approved registered-program contract for {contract.sponsor.sponsor}. It separates registered-apprenticeship requirements from barber-school hour rules and marketing descriptions.</p><div className="mt-5 flex flex-wrap gap-2 text-sm font-bold"><span className="rounded-full bg-cyan-100 px-3 py-2 text-cyan-950">RAPIDS {standard.rapidsCode}</span><span className="rounded-full bg-slate-100 px-3 py-2">O*NET-SOC {standard.onetSocCode}</span><span className="rounded-full bg-slate-100 px-3 py-2">Revision {contract.sponsor.revisionDate}</span></div></div></section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Fact icon={CheckCircle2} label="Progress model" value="Competency-based" detail={`${contract.completion.competencyCount} registered competencies`} /><Fact icon={BookOpen} label="Related instruction" value={`${contract.completion.requiredRtiHours} hours`} detail="RTI must be documented separately from work evidence" /><Fact icon={Users} label="Supervision" value={standard.apprenticeToMentorRatio} detail="Approved apprentice-to-mentor ratio" /><Fact icon={Clock3} label="Probation" value={`${standard.probationaryHours} hours`} detail="Registered probationary period" /></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black text-slate-950">How progress is earned</h2><p className="mt-3 leading-7 text-slate-700">Approved work hours, geofenced time records, attendance, service records, and supervisor observations are evidence of participation and training. This competency-based occupation is completed through verified competency mastery and required RTI—not a generic fixed OJL-hour counter.</p><p className="mt-3 leading-7 text-slate-700">A Host Shop mentor may mark a competency complete only after personally verifying safe and consistent performance. Each verification records the competency, completion date, verifier identity, and supporting notes.</p><Link href="/apprentice/competencies" className="mt-5 inline-flex rounded-xl bg-cyan-700 px-4 py-2.5 font-black text-white">View registered competencies</Link></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black text-slate-950">Required RTI outline — {contract.completion.requiredRtiHours} hours</h2><div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">{standard.relatedInstruction.map((item, index) => <div key={item.title} className="flex items-center justify-between gap-4 px-4 py-4"><div className="flex gap-3"><span className="font-black text-cyan-800">{index + 1}.</span><span className="font-semibold text-slate-900">{item.title}</span></div><span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-800">{item.hours} hrs</span></div>)}</div><Link href="/lms/courses/barber-apprenticeship" className="mt-5 inline-flex rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 font-black text-cyan-950">Open Prestige Elevation RTI</Link></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black text-slate-950">Progressive wages</h2><p className="mt-2 leading-7 text-slate-700">The registered occupation baseline advances with verified competencies. An employer-specific RAPIDS wage schedule, when recorded, is resolved separately by the canonical contract and may establish a higher floor.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><WageStep label="Entry baseline" competencies="0 competencies" rate={standard.startingHourlyRate} />{standard.wageMilestones.map((step) => <WageStep key={step.completedCompetencies} label={step.completedCompetencies === standard.competencyCount ? 'Final baseline step' : 'Progress step'} competencies={`${step.completedCompetencies} competencies`} rate={step.hourlyRate} />)}</div><div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950"><DollarSign className="mt-0.5 h-5 w-5 shrink-0"/><p>Actual payroll evidence and employer-specific RAPIDS wage schedules are maintained separately from the immutable occupation standard for audit verification.</p></div></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black text-slate-950">Work records, geofencing, and Host Shop approval</h2><ul className="mt-4 space-y-3 font-medium leading-7 text-slate-700"><li>• Clock work time only at the approved Host Shop and allow required location evidence.</li><li>• Submit truthful work records; never backdate, duplicate, share credentials, spoof location, or claim work not performed.</li><li>• The Host Shop reviews pending work entries and may approve, reject, or require correction.</li><li>• Work hours do not substitute for required competency verification or RTI completion.</li><li>• Changes in shop, supervisor, employment status, schedule, or extended leave must be reported to the sponsor.</li></ul><Link href="/apprentice/timeclock" className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-black text-slate-900">Open geofenced timeclock</Link></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black text-slate-950">Transfer credit, funding, and records</h2><div className="mt-4 space-y-3 leading-7 text-slate-700"><p><strong>Transfer credit:</strong> Prior training or experience is not automatically credited. Submit official evidence for sponsor review. A Host Shop cannot promise or award transfer credit.</p><p><strong>Workforce funding:</strong> WIOA, OJT reimbursement, supportive services, and other workforce funding require eligibility and authorization by the applicable workforce agency. Funding eligibility is not the same as approved funding.</p><p><strong>Records:</strong> Keep signed apprenticeship documents, RTI records, work records, competency verifications, payroll/wage documentation where required, transfer decisions, and completion records available for program review.</p></div></section>

        <section className="rounded-3xl border-2 border-cyan-300 bg-cyan-50 p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-cyan-800"/><div><h2 className="font-black text-cyan-950">Handbook acknowledgment</h2><p className="mt-1 text-sm font-semibold leading-6 text-cyan-950">Acknowledge receipt after reviewing this registered-program handbook. Documents requiring a binding signature use the platform electronic-signature workflow separately.</p><div className="mt-4">{subject.previewing ? <p className="rounded-lg bg-white p-3 text-sm font-bold text-slate-700">Preview mode: This learner must complete this acknowledgment from their own account.</p> : <AcknowledgeHandbookButton />}</div></div></div></section>
      </div>
    </main>
  );
}

function CosmetologyHandbook({ previewing }: { previewing: boolean }) {
  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-pink-800">Learner operating guide</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Cosmetology Apprenticeship Student Handbook</h1>
          <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-700">Your rules for attendance, verified work time, related technical instruction, payments, conduct, records, and Host Salon participation. Occupation-specific registration terms appear only after an approved standard is attached to the enrollment.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold"><span className="rounded-full bg-pink-100 px-3 py-2 text-pink-950">144 RTI hours</span><span className="rounded-full bg-slate-100 px-3 py-2">Host Salon: Salon Saloon</span></div>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <Policy title="Attendance and participation">
          Attend every scheduled RTI session and every agreed Host Salon shift. Clock in and out accurately, complete assigned learning, and notify the instructor and Host Salon before an absence or late arrival. Missed RTI or supervised work must be documented and made up when required; attendance alone does not prove competency.
        </Policy>
        <Policy title="Geofencing and truthful time records">
          Use the dashboard timeclock only while physically present at the approved Host Salon. Allow location access when clocking in and out. Never share credentials, spoof location, backdate time, duplicate entries, or report hours not worked. A location result is evidence—not automatic approval—and the Host Salon must review submitted work time. If location services fail, stop and report the problem instead of creating a false entry.
        </Policy>
        <Policy title="Payments and automatic billing">
          Self-pay learners must review the disclosed tuition schedule, authorize automatic payments, and save a payment method through Stripe. Receipts and payment progress appear in Billing. Report a failed or changed card promptly. Any access action for nonpayment follows the signed enrollment agreement; completed and approved learner records are retained.
          <Link href="/apprentice/billing" className="mt-4 inline-flex rounded-xl bg-pink-700 px-4 py-2.5 font-black text-white">Set up or review payments</Link>
        </Policy>
        <Policy title="Conduct, safety, and salon rules">
          Follow sanitation, infection-control, client privacy, dress, safety, equipment, and professional-conduct rules. Work only within the learner scope and under required supervision. Harassment, discrimination, falsified records, unsafe practice, retaliation, and misuse of client information are prohibited. Follow the Host Salon’s lawful site rules when they are more specific.
        </Policy>
        <Policy title="Required records and onboarding">
          Complete orientation, acknowledge this handbook, sign the learner apprenticeship and enrollment agreements, and upload every document marked required in the dashboard. Staff employment agreements and the internal digital binder are not learner-facing documents. Report changes to your address, employment, Host Salon, supervisor, or schedule.
          <Link href="/apprentice/documents" className="mt-4 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-black text-slate-900">Open required documents</Link>
        </Policy>
        <section className="rounded-3xl border-2 border-pink-300 bg-pink-50 p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-pink-800"/><div><h2 className="font-black text-pink-950">Handbook acknowledgment required</h2><p className="mt-1 text-sm font-semibold leading-6 text-pink-950">Review every section, then acknowledge receipt. Agreements requiring signatures remain separate required documents.</p><div className="mt-4">{previewing ? <p className="rounded-lg bg-white p-3 text-sm font-bold text-slate-700">Preview mode: This learner must complete this acknowledgment from their own account.</p> : <AcknowledgeHandbookButton />}</div></div></div></section>
      </div>
    </main>
  );
}

function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black text-slate-950">{title}</h2><div className="mt-3 font-medium leading-7 text-slate-700">{children}</div></section>;
}

function Fact({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-cyan-800"/><p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p><p className="mt-2 text-xs font-medium leading-5 text-slate-600">{detail}</p></article>; }
function WageStep({ label, competencies, rate }: { label: string; competencies: string; rate: number }) { return <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">${rate.toFixed(2)}/hr</p><p className="mt-1 text-sm font-semibold text-slate-700">{competencies}</p></article>; }
