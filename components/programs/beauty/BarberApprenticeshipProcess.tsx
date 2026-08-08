import Link from 'next/link';
import { getProgram } from '@/lib/programs/canonical-data';

export default function BarberApprenticeshipProcess() {
  const program = getProgram('barber-apprenticeship');
  const ojlHours = program?.ojtHours ?? 2000;
  const rtiHours = program?.relatedInstructionHours ?? 144;

  const steps = [
    {
      title: 'Apply (free)',
      detail:
        'Submit the apprentice application. There is no tuition charge at this step — we review readiness, host-shop status, transfer-hour evidence, and funding options with you.',
    },
    {
      title: 'Host shop match',
      detail:
        'Train with an approved licensed Indiana barbershop under licensed supervision. The employer provides supervised on-the-job learning and follows the registered wage progression and program standards.',
    },
    {
      title: 'Complete Related Technical Instruction',
      detail: `Complete ${rtiHours.toLocaleString()} hours of Related Technical Instruction (RTI) through the approved instructional pathway. RTI is separate from supervised OJL hours.`,
    },
    {
      title: `${ojlHours.toLocaleString()} supervised OJL hours`,
      detail: `Track ${ojlHours.toLocaleString()} supervised on-the-job learning hours at the approved host shop. Supervisors verify hours and competencies as you progress.`,
    },
    {
      title: 'Completion & licensing pathway',
      detail:
        'After registered-apprenticeship requirements are completed and verified, complete any applicable Indiana licensing and examination requirements. Registered apprenticeship completion and state licensure are separate compliance checkpoints.',
    },
  ] as const;

  return (
    <section className="py-12 border-t border-slate-100 bg-white" id="how-it-works">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2">
          How it works
        </p>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          From application through registered apprenticeship completion
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl mb-8">
          This is a DOL registered apprenticeship, not a short course. The registered program
          requires <strong>{ojlHours.toLocaleString()} supervised OJL hours</strong> plus{' '}
          <strong>{rtiHours.toLocaleString()} RTI hours</strong>. Scheduling and completion time
          depend on approved work hours, progress, transfer-hour determinations, and program status.
        </p>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-slate-600">
          Published self-pay program cost is <strong>$4,980</strong> when approved workforce or employer funding does not apply — use the{' '}
          <Link href="#payment-calculator" className="font-semibold text-brand-blue-600 hover:underline">
            payment calculator
          </Link>{' '}
          for available plan options, or{' '}
          <Link
            href="/programs/barber-apprenticeship/payment/bnpl"
            className="font-semibold text-brand-blue-600 hover:underline"
          >
            compare available payment providers
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
