'use client';

import Link from 'next/link';
import { AlertTriangle, Info, Shield, Calendar } from 'lucide-react';

/**
 * Compliance Guardrails Components
 * 
 * These components provide standardized compliance language and disclaimers
 * to be used throughout the platform for regulatory compliance.
 */

interface DisclaimerProps {
  className?: string;
}

/**
 * No Guarantee Disclaimer - Required on outcome-related pages
 */
export function NoGuaranteeDisclaimer({ className = '' }: DisclaimerProps) {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">No Guarantees</p>
          <p>
            Results vary based on individual circumstances. We do not guarantee job placement, 
            income levels, certification pass rates, or funding approval. Your outcomes depend 
            on your effort, market conditions, and other factors beyond our control.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Funding Disclaimer - Required on WIOA/grant-related pages
 */
export function FundingDisclaimer({ className = '' }: DisclaimerProps) {
  return (
    <div className={`bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-brand-blue-800">
          <p className="font-semibold mb-1">Funding Eligibility</p>
          <p>
            Eligibility for WIOA, WRG, or other funding programs is determined by 
            WorkOne / Indiana Career Connect, not by Elevate for Humanity. Submitting 
            an application does not guarantee funding approval.
          </p>
          <Link href="/check-eligibility" className="text-brand-blue-700 hover:underline mt-2 inline-block">
            Check eligibility requirements →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Not Professional Advice Disclaimer
 */
export function NotAdviceDisclaimer({ className = '' }: DisclaimerProps) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-semibold mb-1">Not Professional Advice</p>
          <p>
            Information provided is for general educational purposes only and does not 
            constitute legal, financial, tax, or medical advice. Consult qualified 
            professionals for advice specific to your situation.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Verification Date Badge - Shows when information was last verified
 */
export function VerificationDate({ 
  date, 
  label = 'Information verified',
  className = '' 
}: { 
  date: string; 
  label?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <Calendar className="w-3 h-3" />
      <span>{label}: {date}</span>
    </div>
  );
}

/**
 * Program Accreditation Notice
 */
export function AccreditationNotice({ 
  accreditingBody,
  className = '' 
}: { 
  accreditingBody?: string;
  className?: string;
}) {
  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      {accreditingBody ? (
        <p>
          This program is accredited by <strong>{accreditingBody}</strong>. 
          Accreditation status is subject to change. Verify current status before enrolling.
        </p>
      ) : (
        <p>
          This program may not be accredited. Check with relevant licensing boards 
          to verify if this training meets requirements in your jurisdiction.
        </p>
      )}
    </div>
  );
}

/**
 * Testimonial Disclaimer - Required when showing success stories
 */
export function TestimonialDisclaimer({ className = '' }: DisclaimerProps) {
  return (
    <p className={`text-xs text-gray-500 italic ${className}`}>
      * Individual results vary. Testimonials represent individual experiences and 
      are not guarantees of future performance. Your results may differ based on 
      effort, market conditions, and other factors.
    </p>
  );
}

/**
 * Income/Salary Disclaimer - Required when showing salary information
 */
export function SalaryDisclaimer({ 
  source,
  date,
  className = '' 
}: { 
  source?: string;
  date?: string;
  className?: string;
}) {
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      Salary data {source ? `from ${source}` : 'shown'} is for informational purposes only 
      and represents averages or ranges. Actual earnings depend on location, experience, 
      employer, and market conditions.
      {date && <span className="block mt-1">Data as of {date}.</span>}
    </p>
  );
}

/**
 * Pre-Application Consent Checkbox
 */
export function ApplicationConsent({ 
  checked,
  onChange,
  className = '' 
}: { 
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
        required
      />
      <span className="text-sm text-gray-700">
        I understand that submitting this application does not guarantee eligibility, 
        funding approval, or enrollment. I acknowledge that I have read and agree to the{' '}
        <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/legal/disclosures" className="text-brand-blue-600 hover:underline">
          Disclosures
        </Link>.
      </span>
    </label>
  );
}

/**
 * Footer Compliance Links
 */
export function ComplianceFooterLinks({ className = '' }: DisclaimerProps) {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/legal/disclosures" className="hover:underline">Disclosures</Link>
        <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
        <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        <Link href="/legal/acceptable-use" className="hover:underline">Acceptable Use</Link>
      </div>
      <p className="mt-2">
        © {new Date().getFullYear()} Elevate for Humanity. All rights reserved.
      </p>
    </div>
  );
}

/**
 * Combined Compliance Banner for program pages
 */
export function ProgramComplianceBanner({ 
  showFunding = true,
  showNoGuarantee = true,
  verificationDate,
  className = '' 
}: { 
  showFunding?: boolean;
  showNoGuarantee?: boolean;
  verificationDate?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {showFunding && <FundingDisclaimer />}
      {showNoGuarantee && <NoGuaranteeDisclaimer />}
      {verificationDate && (
        <VerificationDate date={verificationDate} label="Program information verified" />
      )}
    </div>
  );
}
