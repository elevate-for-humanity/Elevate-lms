import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';

interface LicenseDemoProps {
  /** Tour ID from lib/demo/tours.ts */
  tourId: string;
  /** Display name for the license */
  licenseName: string;
  /** Workflows the user will see in week 1 */
  workflows: string[];
  /** Primary CTA href (trial start or checkout) */
  ctaHref: string;
  /** Primary CTA label */
  ctaLabel: string;
}

export function LicenseDemo({
  tourId,
  licenseName,
  workflows,
  ctaHref,
  ctaLabel,
}: LicenseDemoProps) {
  return (
    <section className="py-12 bg-slate-50 border-t border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          What you&apos;ll do in week 1
        </h2>
        <p className="text-slate-600 mb-6">
          See how the {licenseName} works for your organization.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {workflows.map((w) => (
            <div
              key={w}
              className="flex items-start gap-3 bg-white rounded-lg border border-slate-200 p-4"
            >
              <div className="w-2 h-2 bg-brand-red-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-slate-800">{w}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/demo/tour/${tourId}?step=1`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Play className="w-4 h-4" /> Walk Through the Demo
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors"
          >
            {ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
