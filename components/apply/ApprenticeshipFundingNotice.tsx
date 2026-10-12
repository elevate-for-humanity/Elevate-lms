import { AlertTriangle } from 'lucide-react';

export default function ApprenticeshipFundingNotice() {
  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-amber-950" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
        <div>
          <p className="font-black">Apprenticeship enrollment is self-pay only.</p>
          <p className="mt-1 text-sm font-semibold leading-6">
            Review the published tuition and available payment terms before applying. Apprentices pay their own program tuition.
          </p>
        </div>
      </div>
    </div>
  );
}
