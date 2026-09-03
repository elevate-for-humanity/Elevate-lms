'use client';

import Link from 'next/link';
import { CheckCircle, DollarSign, FileCheck2, ShieldCheck } from 'lucide-react';

interface FundingInfoBlockProps {
  programName: string;
  fundingSources: string[];
  selfPayPrice: number;
  regularPrice?: number;
}

export default function FundingInfoBlock({
  programName,
  fundingSources,
  selfPayPrice,
  regularPrice,
}: FundingInfoBlockProps) {
  return (
    <div className="space-y-5">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-red-600 flex-none mt-0.5" />
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Funding must be verified for this exact program</h3>
            <p className="text-slate-600 text-sm leading-relaxed mt-2">
              Do not assume {programName} is WIOA-, Workforce Ready Grant-, or otherwise funded from
              this enrollment page. A funding source named during screening is not an approval. The
              responsible agency must verify participant and program eligibility and provide the
              applicable written authorization before Elevate treats the enrollment as funded.
            </p>
          </div>
        </div>

        {fundingSources.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-950">Sources requested or considered</p>
            <p className="text-xs text-amber-900 mt-1">
              These labels are informational only and do not establish eligibility or coverage.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {fundingSources.map((source) => (
                <span key={source} className="rounded-full bg-white border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-950">
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          {[
            ['1', 'Confirm program status', 'Verify the exact program record rather than relying on provider-level status.'],
            ['2', 'Confirm participant eligibility', 'The responsible funding source determines whether the participant qualifies.'],
            ['3', 'Obtain authorization', 'Document the approved amount and terms before recording the enrollment as funded.'],
          ].map(([number, title, text]) => (
            <div key={number} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold">{number}</div>
              <p className="font-bold text-slate-900 text-sm mt-3">{title}</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <Link href="/funding" className="inline-flex items-center gap-2 bg-slate-950 text-white text-sm font-bold px-5 py-2.5 rounded-lg">
            <FileCheck2 className="w-4 h-4" /> Review Funding Guidance
          </Link>
          <Link href="/apply" className="inline-flex items-center gap-2 border border-slate-300 text-slate-900 text-sm font-bold px-5 py-2.5 rounded-lg">
            Start Application
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-slate-900">Published self-pay reference</h3>
        </div>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          Current page reference: <strong>${selfPayPrice.toLocaleString()}</strong>
          {regularPrice && regularPrice !== selfPayPrice ? ` (other displayed price: $${regularPrice.toLocaleString()})` : ''}.
          Confirm the current program page and enrollment agreement before payment; they control the participant&apos;s actual charges and terms.
        </p>
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-600">
          <CheckCircle className="w-4 h-4 flex-none mt-0.5" />
          <span>Any financing, installment, employer-payment, or third-party option is subject to its own current terms and approval requirements.</span>
        </div>
      </div>
    </div>
  );
}
