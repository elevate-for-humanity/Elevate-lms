import { AlertTriangle } from 'lucide-react';

export default function ApprenticeshipFundingNotice() {
  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-amber-950" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
        <div>
          <p className="font-black">Apprenticeship enrollment is self-pay only.</p>
          <p className="mt-1 text-sm font-semibold leading-6">
            Review the total tuition, deposit, what is due now, and payment terms. Pay in full or use a program payment plan when offered. BNPL, when displayed, requires separate provider approval and repayment.
          </p>
          <p className="mt-2 text-sm leading-6">A free inquiry requests information. An enrollment application requests admission; payment and submission alone do not confirm enrollment, placement, or a training start date.</p>
        </div>
      </div>
    </div>
  );
}
