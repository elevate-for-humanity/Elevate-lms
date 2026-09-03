import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

type Props = {
  programSlug: string;
  label: string;
  portalPath: string;
};

export function ApprenticeEnrollmentGate({ programSlug, label, portalPath }: Props) {
  const applyHref = `/programs/${programSlug}/apply`;
  const apprenticeLoginHref = `/login?redirect=${encodeURIComponent(portalPath)}`;

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">No active {label} enrollment</h1>
            <p className="text-sm text-slate-600 mt-2">
              This dashboard is only available after you are enrolled in the {label} program. Apply
              first, complete orientation and documents, then return here to track hours, RTI, and
              billing.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            href={applyHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition"
          >
            Apply to {label}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={apprenticeLoginHref}
            className="inline-flex items-center justify-center px-5 py-3 border border-slate-300 text-slate-800 rounded-lg font-semibold text-sm hover:bg-slate-50 transition"
          >
            Sign in with another account
          </Link>
        </div>
      </div>
    </div>
  );
}
