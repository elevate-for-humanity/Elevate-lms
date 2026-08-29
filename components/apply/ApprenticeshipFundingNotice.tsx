import { AlertTriangle } from 'lucide-react';

export default function ApprenticeshipFundingNotice() {
  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-amber-950" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
        <div>
          <p className="font-black">Apprenticeship funding is not currently available.</p>
          <p className="mt-1 text-sm font-semibold leading-6">
            Apprenticeship enrollment is currently self-pay. Do not select WIOA, WorkOne,
            Workforce Ready Grant, FSSA, employer, or other funding unless you already have written
            approval or an Elevate enrollment representative specifically told you that funding is
            available for your application.
          </p>
        </div>
      </div>
    </div>
  );
}
