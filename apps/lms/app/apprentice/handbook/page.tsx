import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock3, DollarSign, ShieldCheck, Users } from 'lucide-react';
import { AcknowledgeHandbookButton } from './AcknowledgeHandbookButton';
import { APPENDIX_A_REGISTRATION, APPENDIX_A_STANDARDS } from '@/lib/compliance/appendix-a-standards';

export const metadata: Metadata = {
  title: 'Registered Barber Apprentice Handbook',
  description: 'Appendix A governed apprentice operating guide for the Registered Barber Apprenticeship.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function ApprenticeHandbookPage() {
  const standard = APPENDIX_A_STANDARDS.barber;

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">USDOL Registered Apprenticeship</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Registered Barber Apprentice Handbook</h1>
          <p className="mt-3 max-w-3xl font-medium leading-7 text-slate-700">This handbook is governed by the approved Appendix A for 2 Exclusive LLC-S. It separates registered-apprenticeship requirements from barber-school hour rules and marketing descriptions.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-cyan-100 px-3 py-2 text-cyan-950">RAPIDS {standard.rapidsCode}</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">O*NET-SOC {standard.onetSocCode}</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Revision {APPENDIX_A_REGISTRATION.revisionDate}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={CheckCircle2} label="Progress model" value="Competency-based" detail={`${standard.competencyCount} Appendix A competencies`} />
          <Fact icon={BookOpen} label="Related instruction" value={`${standard.relatedInstructionHours} hours`} detail="RTI must be documented separately from work evidence" />
          <Fact icon={Users} label="Supervision" value={standard.apprenticeToMentorRatio} detail="Approved apprentice-to-mentor ratio" />
          <Fact icon={Clock3} label="Probation" value={`${standard.probationaryHours} hours`} detail="Appendix A probationary period" />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">How progress is earned</h2>
          <p className="mt-3 leading-7 text-slate-700">Your approved work hours, geofenced time records, attendance, service records, and supervisor observations are evidence of participation and training. For this registered Barber occupation, completion progress is based on demonstrated competency—not a generic 2,000-hour completion counter.</p>
          <p className="mt-3 leading-7 text-slate-700">A Host Shop mentor may mark a competency complete only after personally verifying that you can perform the skill safely and consistently. Each verification records the competency, completion date, verifier identity, and supporting notes.</p>
          <Link href="/apprentice/competencies" className="mt-5 inline-flex rounded-xl bg-cyan-700 px-4 py-2.5 font-black text-white">View Appendix A competencies</Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Required RTI outline — {standard.relatedInstructionHours} hours</h2>
          <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {standard.relatedInstruction.map((item, index) => (
              <div key={item.title} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex gap-3"><span className="font-black text-cyan-800">{index + 1}.</span><span className="font-semibold text-slate-900">{item.title}</span></div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-800">{item.hours} hrs</span>
              </div>
            ))}
          </div>
          <Link href="/lms/courses/barber-apprenticeship" className="mt-5 inline-flex rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 font-black text-cyan-950">Open Prestige Elevation RTI</Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Progressive wages</h2>
          <p className="mt-2 leading-7 text-slate-700">The Appendix A wage schedule advances when verified competencies are completed. The employer must apply the higher of the registered schedule or any wage required by applicable law.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <WageStep label="Entry" competencies="0 competencies" rate={standard.startingHourlyRate} />
            {standard.wageMilestones.map((step) => <WageStep key={step.completedCompetencies} label={step.completedCompetencies === standard.competencyCount ? 'Final Appendix step' : 'Progress step'} competencies={`${step.completedCompetencies} competencies`} rate={step.hourlyRate} />)}
          </div>
          <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950"><DollarSign className="mt-0.5 h-5 w-5 shrink-0"/><p>Your dashboard shows the Appendix wage milestone associated with verified competency progress. Payroll evidence and employer wage updates are maintained separately for audit verification.</p></div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Work records, geofencing, and Host Shop approval</h2>
          <ul className="mt-4 space-y-3 font-medium leading-7 text-slate-700">
            <li>• Clock work time only at the approved Host Shop and allow the platform to capture required location evidence.</li>
            <li>• Submit truthful work records; never backdate, duplicate, share credentials, spoof location, or claim work not performed.</li>
            <li>• The Host Shop reviews pending work entries and may approve, reject, or require correction.</li>
            <li>• Work hours do not substitute for required competency verification or RTI completion.</li>
            <li>• Changes in shop, supervisor, employment status, schedule, or extended leave must be reported to the sponsor.</li>
          </ul>
          <Link href="/apprentice/timeclock" className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-black text-slate-900">Open geofenced timeclock</Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Transfer credit, funding, and records</h2>
          <div className="mt-4 space-y-3 leading-7 text-slate-700">
            <p><strong>Transfer credit:</strong> Prior training or experience is not automatically credited. Submit official evidence for sponsor review. A Host Shop cannot promise or award transfer credit.</p>
            <p><strong>Workforce funding:</strong> WIOA, OJT reimbursement, supportive services, and other workforce funding require eligibility and authorization by the applicable workforce agency. Funding eligibility is not the same as approved funding.</p>
            <p><strong>Records:</strong> Keep your signed apprenticeship documents, RTI records, work records, competency verifications, payroll/wage documentation where required, transfer decisions, and completion records available for program review.</p>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-cyan-300 bg-cyan-50 p-6">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-cyan-800"/><div><h2 className="font-black text-cyan-950">Handbook acknowledgment</h2><p className="mt-1 text-sm font-semibold leading-6 text-cyan-950">Acknowledge receipt after reviewing this Appendix A governed handbook. Documents that require a binding signature use the platform electronic-signature workflow separately.</p><div className="mt-4"><AcknowledgeHandbookButton /></div></div></div>
        </section>
      </div>
    </main>
  );
}

function Fact({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-cyan-800"/><p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p><p className="mt-2 text-xs font-medium leading-5 text-slate-600">{detail}</p></article>;
}

function WageStep({ label, competencies, rate }: { label: string; competencies: string; rate: number }) {
  return <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">${rate.toFixed(2)}/hr</p><p className="mt-1 text-sm font-semibold text-slate-700">{competencies}</p></article>;
}
