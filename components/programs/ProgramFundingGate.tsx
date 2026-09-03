'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Building2, CreditCard, FileCheck2, Home, ShieldCheck } from 'lucide-react';

export type FundingPath = 'fssa' | 'employer' | 'self_pay' | 'self_pay_out_of_state';

interface Props {
  programName: string;
  applyHref: string;
  selfPayCost: string;
  depositAmount: string;
  depositHref: string;
  fullPayHref: string;
  onFundingSelected?: (path: FundingPath) => void;
}

export default function ProgramFundingGate({
  programName,
  applyHref,
  selfPayCost,
  depositAmount,
  depositHref,
  fullPayHref,
  onFundingSelected,
}: Props) {
  const [isResident, setIsResident] = useState<boolean | null>(null);
  const [fundingPath, setFundingPath] = useState<FundingPath | null>(null);

  function selectPath(path: FundingPath) {
    setFundingPath(path);
    onFundingSelected?.(path);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-slate-950 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Funding & Enrollment Review</p>
        <p className="text-white font-bold text-base mt-1">{programName}</p>
      </div>

      <div className="p-5 space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-800 flex-none mt-0.5" />
          <p className="text-sm text-amber-950 leading-relaxed">
            This questionnaire identifies a pathway to review; it does not determine government,
            employer, or other third-party eligibility. Do not treat the enrollment as funded until
            the responsible source confirms the exact program, participant, approved amount, and terms.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-bold text-slate-800">Do you live in Indiana?</p>
          </div>
          <p className="text-xs text-slate-500 mb-3">Residency may be relevant to some funding sources, but it is not proof of eligibility.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => setIsResident(true)} className={`p-3 rounded-xl border-2 text-sm font-semibold ${isResident === true ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>Yes — Indiana</button>
            <button onClick={() => { setIsResident(false); selectPath('self_pay_out_of_state'); }} className={`p-3 rounded-xl border-2 text-sm font-semibold ${isResident === false ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>No — outside Indiana</button>
          </div>
        </div>

        {isResident === true && (
          <div>
            <p className="text-sm font-bold text-slate-800 mb-3">Which pathway should be reviewed?</p>
            <div className="space-y-3">
              <button onClick={() => selectPath('fssa')} className={`w-full text-left rounded-xl border-2 p-4 ${fundingPath === 'fssa' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <FileCheck2 className="w-5 h-5 text-purple-700 flex-none mt-0.5" />
                  <div><p className="font-semibold text-slate-900 text-sm">Public-benefit / agency referral review</p><p className="text-xs text-slate-600 mt-1">Select this only to request review of an applicable agency pathway. Benefit receipt alone does not establish training authorization.</p></div>
                </div>
              </button>
              <button onClick={() => selectPath('employer')} className={`w-full text-left rounded-xl border-2 p-4 ${fundingPath === 'employer' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-blue-700 flex-none mt-0.5" />
                  <div><p className="font-semibold text-slate-900 text-sm">Employer / host-site review</p><p className="text-xs text-slate-600 mt-1">An interested employer or host site does not guarantee sponsorship, reimbursement, wages, tuition payment, or placement.</p></div>
                </div>
              </button>
              <button onClick={() => selectPath('self_pay')} className={`w-full text-left rounded-xl border-2 p-4 ${fundingPath === 'self_pay' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-slate-700 flex-none mt-0.5" />
                  <div><p className="font-semibold text-slate-900 text-sm">Self-pay review</p><p className="text-xs text-slate-600 mt-1">Published reference: {selfPayCost}. Confirm the current enrollment agreement before paying.</p></div>
                </div>
              </button>
            </div>
          </div>
        )}

        {isResident === false && (
          <div className="rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-slate-600 flex-none mt-0.5" />
            <p className="text-sm text-slate-600">Some Indiana public funding pathways may not apply outside Indiana. Review self-pay or another documented source rather than assuming an Indiana program is available.</p>
          </div>
        )}

        {fundingPath && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900">Next step: document the selected pathway</h3>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              Continue to the application and identify the selected pathway. Any third-party source
              must be verified before enrollment is marked funded. Self-pay charges and refund terms
              must match the current enrollment agreement.
            </p>
            <Link href={applyHref} className="inline-flex items-center gap-2 mt-4 bg-slate-950 text-white px-5 py-3 rounded-lg font-bold text-sm">
              Continue to Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <details className="text-xs text-slate-500 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer font-semibold text-slate-700">Self-pay checkout references</summary>
          <div className="mt-3 space-y-2">
            <p>Displayed deposit reference: {depositAmount}. Confirm it against the enrollment agreement before use.</p>
            <p><a href={depositHref} className="underline">Deposit checkout</a> · <a href={fullPayHref} className="underline">Full-pay checkout</a></p>
          </div>
        </details>
      </div>
    </div>
  );
}
