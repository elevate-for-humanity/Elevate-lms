/**
 * Pathway Disclosure Component
 *
 * Required on:
 * - Homepage (under "How It Works")
 * - Every program page (above primary CTA)
 * - Application/intake page (before submission)
 * - ETPL and WRG narrative sections
 * - Partner and employer documentation
 */

import { Shield } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface PathwayDisclosureProps {
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
}

// Full disclosure text - do not edit
const FULL_DISCLOSURE = `${PLATFORM_DEFAULTS.orgName} delivers all training through a structured career pathway. Participants begin with an eligibility and career alignment phase, where funding eligibility is determined and program selection occurs. Once eligibility is confirmed, participants enter occupational training with structured on-the-job learning aligned to a specific career pathway. Training is followed by an employer-hosted internship or work-based placement designed to support transition into employment. Program enrollment, training, and placement are contingent upon eligibility, funding availability, and employer participation.`;

// Compact version for program pages
const COMPACT_DISCLOSURE = `This program is part of the ${PLATFORM_DEFAULTS.orgName} Career Pathway and begins after eligibility determination. Enrollment is contingent upon eligibility, funding availability, and employer participation.`;

// Inline version for headers/banners
const INLINE_DISCLOSURE = `All programs require eligibility screening before enrollment.`;

export default function PathwayDisclosure({
  variant = 'full',
  className = '',
}: PathwayDisclosureProps) {
  if (variant === 'inline') {
    return <p className={`text-sm text-slate-700 ${className}`}>{INLINE_DISCLOSURE}</p>;
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-blue-800">{COMPACT_DISCLOSURE}</p>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-brand-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 mb-2">Career Pathway Disclosure</h4>
          <p className="text-sm text-slate-900 leading-relaxed">{FULL_DISCLOSURE}</p>
        </div>
      </div>
    </div>
  );
}

// Export disclosure text for use in other contexts (ETPL docs, etc.)
export const PATHWAY_DISCLOSURE = {
  full: FULL_DISCLOSURE,
  compact: COMPACT_DISCLOSURE,
  inline: INLINE_DISCLOSURE,
};
