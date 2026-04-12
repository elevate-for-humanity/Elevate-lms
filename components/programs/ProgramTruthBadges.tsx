/**
 * ProgramTruthBadges — delivery model badge and funding section.
 *
 * These components render only verified data from the program schema.
 * No fallback text is shown when data is absent — silence is better than a lie.
 */

import type { DeliveryModel, FundingType } from '@/lib/programs/program-schema';
import { CheckCircle, Monitor, Users, ExternalLink, Layers } from 'lucide-react';

// ─── DeliveryBadge ────────────────────────────────────────────────────────────

const DELIVERY_LABELS: Record<DeliveryModel, string> = {
  internal_lms:      'Instructor-Led + LMS Training',
  partner_scorm:     'Online Certification (Self-Paced)',
  external_redirect: 'State-Approved Training Provider',
  hybrid:            'Blended Training (Online + Hands-On)',
};

const DELIVERY_ICONS: Record<DeliveryModel, React.ElementType> = {
  internal_lms:      Monitor,
  partner_scorm:     ExternalLink,
  external_redirect: ExternalLink,
  hybrid:            Layers,
};

const DELIVERY_COLORS: Record<DeliveryModel, string> = {
  internal_lms:      'bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200',
  partner_scorm:     'bg-purple-50 text-purple-700 border-purple-200',
  external_redirect: 'bg-slate-50 text-slate-600 border-slate-200',
  hybrid:            'bg-brand-green-50 text-brand-green-700 border-brand-green-200',
};

interface DeliveryBadgeProps {
  model: DeliveryModel;
}

export function DeliveryBadge({ model }: DeliveryBadgeProps) {
  const Icon = DELIVERY_ICONS[model];
  const label = DELIVERY_LABELS[model];
  const color = DELIVERY_COLORS[model];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

// ─── FundingSection ───────────────────────────────────────────────────────────

const FUNDING_COPY: Record<FundingType, { label: string; detail: string }> = {
  wioa:          { label: 'WIOA Eligible', detail: 'Workforce Innovation and Opportunity Act — covers tuition for eligible Indiana residents through WorkOne.' },
  wrg:           { label: 'Workforce Ready Grant', detail: 'Indiana state grant covering tuition for high-demand programs. Eligibility determined through WorkOne.' },
  impact:        { label: 'FSSA IMPACT', detail: 'Indiana Manpower Placement and Comprehensive Training — pays for training at no cost to current SNAP or TANF recipients. Contact FSSA at 800-403-0864 (press 3) or ask your DFR eligibility worker for a referral.' },
  employer_paid: { label: 'Employer-Sponsored', detail: 'Earn wages while you train. Employer covers tuition through the apprenticeship agreement.' },
  self_pay:      { label: 'Self-Pay Available', detail: 'Flexible payment plans, BNPL options (Klarna, Afterpay, Zip), and income-share available.' },
  unknown:       { label: 'Funding Details Pending', detail: 'Funding options are being confirmed. Contact us for current availability.' },
};

interface FundingSectionProps {
  fundingOptions: FundingType[];
  /** Suppress the 'unknown' entry in public-facing UI */
  hideUnknown?: boolean;
}

export function FundingSection({ fundingOptions, hideUnknown = true }: FundingSectionProps) {
  const options = hideUnknown
    ? fundingOptions.filter(f => f !== 'unknown')
    : fundingOptions;

  if (!options.length) return null;

  return (
    <div className="space-y-2">
      {options.map(f => {
        const { label, detail } = FUNDING_COPY[f];
        return (
          <div key={f} className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <span className="text-sm font-semibold text-slate-800">{label}</span>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
