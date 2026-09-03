// Central place to define tuition + Stripe payment links for each program.
// Replace the example stripePaymentLink values with your REAL Stripe links.

export type PaymentMode = 'full' | 'installments';

export interface PaymentOption {
  id: string;
  label: string;
  description?: string;
  mode: PaymentMode;
  amountUsd: number;
  installments?: {
    count: number;
    amountUsd: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
  };
  stripePaymentLink?: string; // Paste your Stripe Payment Link URL here
}

export interface ProgramPaymentConfig {
  programId: string;
  headline: string;
  isStateFunded: boolean;
  notes?: string;
  baseTuitionUsd?: number;
  paymentOptions: PaymentOption[];
}

export const programPaymentConfigs: ProgramPaymentConfig[] = [
  {
    programId: 'prog-cna',
    headline: 'CNA Training – Workforce-Aligned',
    isStateFunded: false,
    baseTuitionUsd: 2200,
    notes:
      'CNA is not state-funded in your setup, but can be supported by WRG, JRI onramp, employer sponsorship or philanthropy.',
    paymentOptions: [
      {
        id: 'cna-full',
        label: 'Pay in Full',
        mode: 'full',
        amountUsd: 2200,
        description: 'Best for learners who are paying out-of-pocket or have employer sponsorship.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
      {
        id: 'cna-plan',
        label: 'Payment Plan (Monthly)',
        mode: 'installments',
        amountUsd: 0,
        installments: {
          count: 6,
          amountUsd: 400,
          frequency: 'monthly',
        },
        description:
          'Spread tuition over 6 monthly payments. Ideal when combined with part-time work.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
    ],
  },
  {
    programId: 'prog-barber',
    headline: 'Barber Apprenticeship – Earn While You Learn',
    isStateFunded: true,
    baseTuitionUsd: 0,
    notes:
      'This program is structured as a registered apprenticeship with Milady content and on-the-job training.',
    paymentOptions: [
      {
        id: 'barber-employer',
        label: 'Employer / Sponsoring Shop',
        mode: 'full',
        amountUsd: 0,
        description:
          'Typically covered by employer/apprenticeship sponsor. No direct tuition to learner.',
      },
    ],
  },
  {
    programId: 'prog-tax-vita',
    headline: 'Tax & VITA – Community Tax Prep Track',
    isStateFunded: true,
    baseTuitionUsd: 0,
    notes:
      'Course content is powered by IRS Link & Learn, VITA, and Intuit Academy. Focus on community impact, IRS certification, and stipend pathways.',
    paymentOptions: [
      {
        id: 'tax-sponsored',
        label: 'Sponsored (VITA / Grant-Funded)',
        mode: 'full',
        amountUsd: 0,
        description:
          'Funded via VITA partnerships, philanthropy, or workforce grants. Learners typically do not pay tuition out-of-pocket.',
      },
    ],
  },
  {
    programId: 'prog-hvac',
    headline: 'HVAC Technician – Workforce Ready Pathway',
    isStateFunded: true,
    baseTuitionUsd: 4800,
    notes:
      'Designed to align with WRG / WIOA funding, employer sponsorship, and earn-while-you-learn OJT placements.',
    paymentOptions: [
      {
        id: 'hvac-full',
        label: 'Employer / Sponsor Pays',
        mode: 'full',
        amountUsd: 4800,
        description:
          'Ideal when a contractor, employer, or partner pays tuition on behalf of the learner.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
      {
        id: 'hvac-plan',
        label: 'Learner Payment Plan (Monthly)',
        mode: 'installments',
        amountUsd: 0,
        installments: {
          count: 8,
          amountUsd: 650,
          frequency: 'monthly',
        },
        description:
          'Payment plan that can be layered with WEX/OJT wages to keep out-of-pocket affordable.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
    ],
  },
  {
    programId: 'prog-cdl',
    headline: 'CDL Training – Entry-Level Driver Pathway',
    isStateFunded: true,
    baseTuitionUsd: 5200,
    notes:
      'Built to pair with WRG/WIOA funding, employer sponsorship, and FMCSA entry-level driver training (ELDT) requirements through partner schools.',
    paymentOptions: [
      {
        id: 'cdl-employer',
        label: 'Employer / Sponsor Pays',
        mode: 'full',
        amountUsd: 5200,
        description:
          'Preferred when a carrier or employer sponsor covers tuition as part of a hire-on pathway.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
      {
        id: 'cdl-plan',
        label: 'Learner Payment Plan (Monthly)',
        mode: 'installments',
        amountUsd: 0,
        installments: {
          count: 8,
          amountUsd: 750,
          frequency: 'monthly',
        },
        description:
          'Payment plan structure that can be paired with WEX/OJT stipends so learners can earn while they train.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
    ],
  },
  {
    programId: 'prog-business-apprentice',
    headline: 'Business Support & Office Professional Apprenticeship',
    isStateFunded: true,
    baseTuitionUsd: 3500,
    notes:
      'Structured as an earn-while-you-learn apprenticeship focused on admin, customer service, and office technology roles. Ideal for WEX/OJT layering.',
    paymentOptions: [
      {
        id: 'biz-employer',
        label: 'Employer / Sponsor Pays',
        mode: 'full',
        amountUsd: 3500,
        description:
          'Designed for employers who want to upskill new or current staff into business support roles.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
      {
        id: 'biz-plan',
        label: 'Learner Payment Plan (Monthly)',
        mode: 'installments',
        amountUsd: 0,
        installments: {
          count: 6,
          amountUsd: 600,
          frequency: 'monthly',
        },
        description:
          'Can be combined with part-time WEX placements so learners earn while they study.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
    ],
  },
  {
    programId: 'prog-esthetics-apprentice',
    headline: 'Esthetics Apprenticeship – Skin, Spa & Wellness',
    isStateFunded: true,
    baseTuitionUsd: 4200,
    notes:
      'Apprenticeship-style program for esthetics, spa, and wellness roles, aligned with partner salons/spas and beauty boards.',
    paymentOptions: [
      {
        id: 'esthetics-employer',
        label: 'Salon/Spa Sponsored Seat',
        mode: 'full',
        amountUsd: 4200,
        description:
          'Ideal when a salon, spa, or wellness center sponsors an apprentice and recoups costs through service hours.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
      {
        id: 'esthetics-plan',
        label: 'Learner Payment Plan (Monthly)',
        mode: 'installments',
        amountUsd: 0,
        installments: {
          count: 8,
          amountUsd: 575,
          frequency: 'monthly',
        },
        description:
          'Can be layered with apprenticeship wages so out-of-pocket costs stay manageable.',
        stripePaymentLink: undefined, // Configure in Stripe Dashboard
      },
    ],
  },
];

export function getPaymentConfigForProgram(programId: string): ProgramPaymentConfig | undefined {
  return programPaymentConfigs.find((cfg) => cfg.programId === programId);
}
