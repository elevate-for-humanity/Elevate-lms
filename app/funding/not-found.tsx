import Link from 'next/link';
import { DollarSign, ArrowLeft } from 'lucide-react';

export default function FundingNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-white">
      <div className="text-center px-4 max-w-lg">
        <div className="text-6xl font-black text-slate-700 mb-4">404</div>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Funding Page Not Found</h2>
        <p className="text-black mb-6">
          This funding page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/funding"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 transition font-semibold text-sm"
          >
            <DollarSign className="h-4 w-4" />
            Funding Options
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition font-semibold text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
