/**
 * ProgramTruthBadges — delivery model badge and funding section.
 *
 * These components render only verified data from the program schema.
 * No fallback text is shown when data is absent — silence is better than a lie.
 */

import type { DeliveryModel, FundingType } from '@/lib/programs/program-schema';
import { Monitor, Users, ExternalLink, Layers } from 'lucide-react';

// ─── DeliveryBadge ────────────────────────────────────────────────────────────

const DELIVERY_LABELS: Record<DeliveryModel, string> = {
  internal_lms: 'Instructor-Led + LMS Training',
  partner_scorm: 'Online Certification (Self-Paced)',
  external_redirect: 'State-Approved Training Provider',
  hybrid: 'Blended Training (Online + Hands-On)',
};

const DELIVERY_ICONS: Record<DeliveryModel, React.ElementType> = {
  internal_lms: Monitor,
  partner_scorm: ExternalLink,
  external_redirect: ExternalLink,
  hybrid: Layers,
};

interface DeliveryBadgeProps {
  model: DeliveryModel;
}

export function DeliveryBadge({ model }: DeliveryBadgeProps) {
  const Icon = DELIVERY_ICONS[model] as React.ComponentType<{
    className?: string;
    'aria-hidden'?: boolean;
  }>;
  const label = DELIVERY_LABELS[model];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
      <Icon className="w-3.5 h-3.5" aria-hidden />
      {label}
    </span>
  );
}

// ─── FundingSection ───────────────────────────────────────────────────────────

const FUNDING_COPY: Record<FundingType, { label: string; detail: string }> = {
  wioa: {
    label: 'WIOA Consideration',
    detail:
      'WorkOne may authorize eligible program costs after reviewing the participant and issuing written authorization.',
  },
  wrg: {
    label: 'Workforce Ready Grant Consideration',
    detail:
      'Shown only for confirmed CDL and HVAC pathways. The responsible agency determines participant and program eligibility.',
  },
  impact: {
    label: 'FSSA IMPACT',
    detail:
      'Indiana Manpower Placement and Comprehensive Training — pays for training at no cost to current SNAP or TANF recipients. Contact FSSA at 800-403-0864 (press 3) or ask your DFR eligibility worker for a referral.',
  },
  employer_paid: {
    label: 'Employer-Sponsored',
    detail:
      'Earn wages while you train. Employer covers tuition through the apprenticeship agreement.',
  },
  self_pay: {
    label: 'Self-Pay Available',
    detail: 'Published tuition and currently available checkout options are shown below.',
  },
  unknown: {
    label: 'Funding Details Pending',
    detail: 'Funding options are being confirmed. Contact us for current availability.',
  },
};

interface FundingSectionProps {
  fundingOptions: FundingType[];
  /** Suppress the 'unknown' entry in public-facing UI */
  hideUnknown?: boolean;
}

export function FundingSection({ fundingOptions, hideUnknown = true }: FundingSectionProps) {
  const options = hideUnknown ? fundingOptions.filter((f) => f !== 'unknown') : fundingOptions;

  if (!options.length) return null;

  return (
    <div className="space-y-2">
      {options.map((f) => {
        const entry = FUNDING_COPY[f];
        if (!entry) return null; // guard against invalid FundingType values in data
        const { label, detail } = entry;
        return (
          <div key={f} className="flex items-start gap-2.5">
            <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-slate-400">•</span>
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

