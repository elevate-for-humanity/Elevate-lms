/**
 * Marketing program content — fallback for ISR pages when DB is unavailable.
 * Keep factual program requirements in canonical program configuration.
 */

export type MarketingProgram = {
  slug?: string;
  title: string;
  summary: string;
  description: string;
  sections: Array<{ heading: string; body: string }>;
};

export const programs: MarketingProgram[] = [
  {
    slug: 'cna',
    title: 'Certified Nursing Assistant (CNA)',
    summary: 'Indiana CNA workforce training.',
    description: 'Clinical and classroom preparation for CNA employment and certification.',
    sections: [{ heading: 'Program overview', body: 'See the CNA program page for current schedule, funding, and credential details.' }],
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    summary: 'Clinical and administrative medical assisting training.',
    description: 'Prepare for entry-level medical assisting work and applicable certification.',
    sections: [{ heading: 'Program overview', body: 'See the Medical Assistant program page for current schedule, funding, and credential details.' }],
  },
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    summary: 'Heating, ventilation, air-conditioning, and refrigerant-handling training.',
    description: 'Career training with EPA 608 preparation and workforce-funding pathways where eligible.',
    sections: [{ heading: 'Program overview', body: 'See the HVAC program page for current schedule, funding, and credential details.' }],
  },
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    summary: 'Commercial driver training and licensing preparation.',
    description: 'Hands-on CDL preparation with workforce-funding pathways where eligible.',
    sections: [{ heading: 'Program overview', body: 'See the CDL program page for current schedule, funding, and credential details.' }],
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    summary: 'DOL Registered Apprenticeship in barbering.',
    description: 'Registered apprenticeship requiring 2,000 on-the-job learning hours with 144 hours of related instruction, tracked under the program’s registered standards.',
    sections: [
      { heading: 'What you will learn', body: 'Haircutting, sanitation, client service, state-aligned skill development, and practical readiness.' },
      { heading: 'Credential pathway', body: 'Completion supports the registered apprenticeship and Indiana barber licensing pathway; current requirements are shown on the canonical program page.' },
    ],
  },
  {
    slug: 'business-startup',
    title: 'Business Start-Up & Career Advancement',
    summary: 'Business formation, financial literacy, operations, and career advancement.',
    description: 'Workforce-aligned entrepreneurship and business-readiness training.',
    sections: [{ heading: 'Program overview', body: 'See the Business program page for current schedule, funding, and credential details.' }],
  },
];
