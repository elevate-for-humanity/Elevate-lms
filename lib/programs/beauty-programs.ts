/**
 * Config for the 4 beauty/apprenticeship programs that share a common
 * enrollment flow: apply → orientation → documents → eligibility →
 * payment-setup → confirm → enrollment-success
 *
 * All pages under app/programs/[program]/ read from this config.
 * Do not add per-program page files — extend this config instead.
 */

export interface BeautyProgramConfig {
  /** URL slug — matches the directory name under app/programs/ */
  slug: string;
  /** Display name */
  title: string;
  /** Short label used in headings */
  shortTitle: string;
  /** Tailwind color token (without shade) e.g. "purple", "rose", "pink" */
  color: string;
  /** Indiana license name */
  licenseTitle: string;
  /** Registered minimum work/term hours when the occupation uses an hour-based or hybrid term. Competency-based programs use 0 here. */
  ojtHours: number;
  /** Registered RTI hours. */
  rtiHours: number;
  /** Registered progress model. */
  progressModel: 'competency_based' | 'hybrid';
  competencyCount?: number;
  probationHours: number;
  /** Deposit amount in cents (for Stripe payment intent) */
  depositCents: number;
  /** Full tuition in cents */
  fullTuitionCents: number;
  /** Stripe payment link — deposit */
  stripeDepositLink: string;
  /** Stripe payment link — full */
  stripeFullLink: string;
  /** Whether this is a paid apprenticeship (earn wages, no tuition) */
  earnWhileYouLearn: boolean;
  /** Orientation estimated time */
  orientationTime: string;
  /** Next steps shown on enrollment-success */
  nextSteps: { title: string; desc: string }[];
}

// NOTE: barber-apprenticeship is intentionally NOT in this map.
// It has its own dedicated enrollment flow under
// app/programs/barber-apprenticeship/ with custom pricing, checkout,
// and webhook logic. Do not add it here.

export const BEAUTY_PROGRAMS: Record<string, BeautyProgramConfig> = {
  'cosmetology-apprenticeship': {
    slug: 'cosmetology-apprenticeship',
    title: 'Hair Stylist Apprenticeship',
    shortTitle: 'Hair Stylist / Cosmetologist',
    color: 'purple',
    licenseTitle: 'Indiana Cosmetology License',
    ojtHours: 2000,
    rtiHours: 154,
    progressModel: 'hybrid',
    probationHours: 500,
    depositCents: 210000,
    fullTuitionCents: 600000,
    stripeDepositLink: 'https://buy.stripe.com/fZu00j2UUdnofsDcfDgIo0a',
    stripeFullLink: 'https://buy.stripe.com/9B600jbrq1EGdkvgvTgIo09',
    earnWhileYouLearn: true,
    orientationTime: '10–12 minutes',
    nextSteps: [
      { title: 'Complete orientation', desc: 'Sanitation, safety, and salon protocols — required before hands-on training' },
      { title: 'Complete the registered hybrid term', desc: 'RAPIDS 0096HY V1 requires a 2,000–2,500-hour hybrid term plus 154 RTI hours; 500 hours is probation, not graduation' },
      { title: 'Complete Indiana licensing steps', desc: 'After registered-program completion, follow the applicable Indiana examination and licensing process' },
    ],
  },
  'esthetician': {
    slug: 'esthetician',
    title: 'Esthetician Program',
    shortTitle: 'Esthetician',
    color: 'pink',
    licenseTitle: 'Indiana Esthetician License',
    ojtHours: 0,
    rtiHours: 300,
    progressModel: 'competency_based',
    competencyCount: 20,
    probationHours: 500,
    depositCents: 112000,
    fullTuitionCents: 320000,
    stripeDepositLink: 'https://buy.stripe.com/cNicN52UU4QS4NZ1AZgIo06',
    stripeFullLink: 'https://buy.stripe.com/bJedR91QQgzAfsD0wVgIo05',
    earnWhileYouLearn: false,
    orientationTime: '8–10 minutes',
    nextSteps: [
      { title: 'Complete orientation', desc: 'Sanitation, safety, and spa protocols — required before hands-on training' },
      { title: 'Apply for your Indiana Esthetician License', desc: 'We guide you through the Indiana licensing application after completing the registered apprenticeship requirements' },
      { title: 'Complete registered requirements', desc: 'Complete 20 verified Appendix A competencies plus 300 RTI hours; work hours remain auditable training evidence and 500 hours is probation' },
    ],
  },
  'nail-technician-apprenticeship': {
    slug: 'nail-technician-apprenticeship',
    title: 'Nail Technician Apprenticeship',
    shortTitle: 'Nail Tech',
    color: 'rose',
    licenseTitle: 'Indiana Nail Technician License',
    ojtHours: 0,
    rtiHours: 210,
    progressModel: 'competency_based',
    competencyCount: 19,
    probationHours: 500,
    depositCents: 175000,
    fullTuitionCents: 500000,
    stripeDepositLink: 'https://buy.stripe.com/cNicN52UU4QS4NZ1AZgIo06',
    stripeFullLink: 'https://buy.stripe.com/bJedR91QQgzAfsD0wVgIo05',
    earnWhileYouLearn: false,
    orientationTime: '8–10 minutes',
    nextSteps: [
      { title: 'Complete orientation', desc: 'Sanitation, safety, and salon protocols — required before hands-on training' },
      { title: 'Apply for your Indiana Nail Technician License', desc: 'We guide you through the Indiana licensing application after completing the registered apprenticeship requirements' },
      { title: 'Complete registered requirements', desc: 'Complete 19 verified Appendix A competencies plus 210 RTI hours; work hours remain auditable training evidence and 500 hours is probation' },
    ],
  },
};

export function getBeautyProgram(slug: string): BeautyProgramConfig | null {
  return BEAUTY_PROGRAMS[slug] ?? null;
}

/** Tailwind classes derived from the program color token */
export function colorClasses(color: string) {
  const map: Record<string, {
    bg: string; bgLight: string; bgDark: string;
    text: string; textLight: string;
    border: string; hover: string; ring: string;
    spinner: string;
  }> = {
    blue:   { bg: 'bg-blue-600',   bgLight: 'bg-blue-100',  bgDark: 'bg-blue-700',   text: 'text-blue-600',   textLight: 'text-blue-700',  border: 'border-blue-200', hover: 'hover:bg-blue-700',  ring: 'ring-blue-500',  spinner: 'text-blue-600'  },
    purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-100',bgDark: 'bg-purple-700', text: 'text-purple-600', textLight: 'text-purple-700',border: 'border-purple-200',hover: 'hover:bg-purple-700',ring: 'ring-purple-500',spinner: 'text-purple-600'},
    pink:   { bg: 'bg-pink-600',   bgLight: 'bg-pink-100',  bgDark: 'bg-pink-700',   text: 'text-pink-600',   textLight: 'text-pink-700',  border: 'border-pink-200', hover: 'hover:bg-pink-700',  ring: 'ring-pink-500',  spinner: 'text-pink-600'  },
    rose:   { bg: 'bg-rose-600',   bgLight: 'bg-rose-100',  bgDark: 'bg-rose-700',   text: 'text-rose-600',   textLight: 'text-rose-700',  border: 'border-rose-200', hover: 'hover:bg-rose-700',  ring: 'ring-rose-500',  spinner: 'text-rose-600'  },
  };
  return map[color] ?? map.blue;
}
