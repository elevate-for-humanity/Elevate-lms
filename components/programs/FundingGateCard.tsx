'use client';

/**
 * FundingGateCard
 *
 * Shown on apprentice apply index pages.
 * Asks "How are you planning to pay?" before routing the user:
 *   - Self-pay / payment plan → enrollment flow (enrollHref)
 *   - Any funding source      → inquiry flow (inquiryHref)
 *
 * Props:
 *   icon        — icon element rendered in the card header
 *   title       — card heading
 *   description — card sub-text
 *   enrollHref  — destination when self-pay is selected
 *   inquiryHref — destination when funding is selected
 *   accentColor — Tailwind color token prefix, e.g. 'brand-red' or 'brand-blue'
 */

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
];

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  enrollHref: string;
  inquiryHref: string;
  /** Tailwind color prefix, e.g. 'brand-red' */
  accentColor?: string;
}

export default function FundingGateCard({
  icon,
  title,
  description,
  enrollHref,
  inquiryHref,
  routeFundedToEnrollment = false,
  accentColor = 'brand-red',
}: Props) {
  const router = useRouter();
  const [funding, setFunding] = useState('');
  const [touched, setTouched] = useState(false);

  const handleContinue = () => {
    if (!funding) {
      setTouched(true);
      return;
    }
    if (SELF_PAY_VALUES.has(funding)) {
      router.push(enrollHref);
    } else {
      // Pass funding type so the inquiry form can pre-fill it
      router.push(`${inquiryHref}?funding=${encodeURIComponent(funding)}`);
    }
  };

  return (
    <div className="p-6 bg-white border-2 border-slate-200 rounded-xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full bg-${accentColor}-50 flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="font-bold text-slate-900 text-lg">{title}</p>
          <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Funding dropdown */}
      <div className="relative">
        <label htmlFor={`funding-${title.replace(/\s+/g, '-').toLowerCase()}`} className="block text-sm font-semibold text-slate-700 mb-1">
          How are you planning to pay? <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id={`funding-${title.replace(/\s+/g, '-').toLowerCase()}`}
            value={funding}
            onChange={(e) => { setFunding(e.target.value); setTouched(false); }}
            className={`w-full appearance-none border rounded-lg px-4 py-2.5 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent ${
              touched && !funding ? 'border-red-400 bg-red-50' : 'border-slate-300'
            }`}
          >
            {FUNDING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} disabled={o.value === ''}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        {touched && !funding && (
          <p className="text-xs text-red-600 mt-1">Please select a payment option to continue.</p>
        )}
        {funding && !SELF_PAY_VALUES.has(funding) && (
          <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            We&apos;ll connect you with an advisor who can help secure funding for your program.
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleContinue}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white transition-colors ${
          funding
            ? SELF_PAY_VALUES.has(funding)
              ? `bg-${accentColor}-600 hover:bg-${accentColor}-700`
              : 'bg-slate-800 hover:bg-slate-900'
            : 'bg-slate-300 cursor-not-allowed'
        }`}
      >
        {funding && !SELF_PAY_VALUES.has(funding) ? 'Talk to an Advisor' : 'Continue to Application'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
