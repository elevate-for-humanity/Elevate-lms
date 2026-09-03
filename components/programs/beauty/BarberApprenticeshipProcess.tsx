import Link from 'next/link';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export default function BarberApprenticeshipProcess() {
  const registered = getRegisteredProgramStandard('barber-apprenticeship');
  if (!registered) return null;
  const competencyCount = registered.completion.competencyCount;
  const rtiHours = registered.completion.requiredRtiHours;

  const steps = [
    {
      title: 'Apply',
      detail: 'Submit the apprentice application. We review readiness, host-shop status, prior-training evidence, payment, and funding options before enrollment is finalized.',
    },
    {
      title: 'Host shop placement',
      detail: 'Train with an approved licensed Indiana barbershop under the registered 1:1 supervision requirement. The employer maintains truthful work and wage records under the applicable registered schedule.',
    },
    {
      title: `Complete ${rtiHours} verified RTI hours`,
      detail: `Complete the approved Related Technical Instruction outline. RTI is documented and verified separately from supervised work evidence.`,
    },
    {
      title: `Verify all ${competencyCount} registered competencies`,
      detail: 'The assigned authorized supervisor verifies demonstrated competency against the approved Work Process Schedule. Elapsed work hours do not substitute for competency verification.',
    },
    {
      title: 'Completion & licensing pathway',
      detail: 'After registered competencies, verified RTI, and required sponsor/worksite records are complete, finish any applicable Indiana licensing and examination requirements. Registered completion and state licensure are separate checkpoints.',
    },
  ] as const;

  return (
    <section className="border-t border-slate-100 bg-white py-12" id="how-it-works">
      <div className="mx-auto max-w-5xl px-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-600">How it works</p>
        <h2 className="mb-2 text-2xl font-extrabold text-slate-900">From application through registered apprenticeship completion</h2>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-slate-600">
          RAPIDS {registered.standard.rapidsCode} is competency-based. Registered completion requires <strong>{competencyCount} verified competencies</strong> plus <strong>{rtiHours} verified RTI hours</strong>. Supervised work hours, attendance, wages, and location records remain auditable evidence but are not a fixed DOL completion denominator.
        </p>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red-600 text-sm font-bold text-white">{index + 1}</span>
              <div><h3 className="font-bold text-slate-900">{step.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{step.detail}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-slate-600">
          Use the <Link href="#payment-calculator" className="font-semibold text-brand-blue-600 hover:underline">payment calculator</Link> for current self-pay plan options or <Link href="/programs/barber-apprenticeship/payment/bnpl" className="font-semibold text-brand-blue-600 hover:underline">compare available payment providers</Link>. Workforce or employer funding must be separately authorized before it is treated as payment.
        </p>
      </div>
    </section>
  );
}
