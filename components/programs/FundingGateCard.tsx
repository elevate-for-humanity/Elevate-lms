'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown } from 'lucide-react';

const SELF_PAY_VALUES = new Set(['self-pay', 'payment-plan']);

const FUNDING_OPTIONS = [
  { value: '', label: 'How are you planning to pay?' },
  { value: 'self-pay', label: 'Self-pay (out of pocket)' },
  { value: 'payment-plan', label: 'Self-pay with payment plan' },
  { value: 'wioa', label: 'WIOA / WorkOne funding' },
  { value: 'fssa', label: 'FSSA (Family & Social Services)' },
  { value: 'jri', label: 'Job Ready Indy / Reentry funding' },
  { value: 'workforce-ready-grant', label: 'Workforce Ready Grant' },
  { value: 'employer-sponsored', label: 'Employer sponsored' },
  { value: 'not-sure', label: 'Not sure — need guidance' },
] as const;

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  enrollHref: string;
  inquiryHref: string;
  /** When true, funded applicants stay in the full enrollment application. */
  routeFundedToEnrollment?: boolean;
  /** Retained for API compatibility; visual styling uses canonical brand colors. */
  accentColor?: string;
}

export default function FundingGateCard({
  icon,
  title,
  description,
  enrollHref,
  inquiryHref,
  routeFundedToEnrollment = false,
}: Props) {
  const router = useRouter();
  const [funding, setFunding] = useState('');
  const [touched, setTouched] = useState(false);

  const handleContinue = () => {
    if (!funding) {
      setTouched(true);
      return;
    }

    const query = `funding=${encodeURIComponent(funding)}`;
    if (SELF_PAY_VALUES.has(funding) || routeFundedToEnrollment) {
      router.push(`${enrollHref}${enrollHref.includes('?') ? '&' : '?'}${query}`);
      return;
    }
    router.push(`${inquiryHref}${inquiryHref.includes('?') ? '&' : '?'}${query}`);
  };

  const funded = Boolean(funding) && !SELF_PAY_VALUES.has(funding);

  return (
    <div className="space-y-4 rounded-xl border-2 border-slate-200 bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-red-50">{icon}</div>
        <div>
          <p className="text-lg font-bold text-slate-950">{title}</p>
          <p className="text-sm leading-relaxed text-slate-700">{description}</p>
        </div>
      </div>

      <div className="relative">
        <label htmlFor={`funding-${title.replace(/\s+/g, '-').toLowerCase()}`} className="mb-1 block text-sm font-semibold text-slate-900">
          How are you planning to pay? <span className="text-red-600">*</span>
        </label>
        <div className="relative">
          <select
            id={`funding-${title.replace(/\s+/g, '-').toLowerCase()}`}
            value={funding}
            onChange={(event) => {
              setFunding(event.target.value);
              setTouched(false);
            }}
            className={`w-full appearance-none rounded-lg border bg-white px-4 py-3 pr-10 text-slate-950 focus:border-brand-red-500 focus:outline-none focus:ring-2 focus:ring-brand-red-200 ${touched && !funding ? 'border-red-500' : 'border-slate-300'}`}
          >
            {FUNDING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} disabled={!option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        {touched && !funding && <p className="mt-1 text-xs font-semibold text-red-700">Select a payment or funding option to continue.</p>}
        {funded && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            Funding eligibility must be verified. Your application will collect the WorkOne/funding information required for review.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!funding}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {funded && !routeFundedToEnrollment ? 'Continue to Funding Inquiry' : 'Continue to Application'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
