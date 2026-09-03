export type ProgramCategory =
  | 'healthcare'
  | 'skilled-trades'
  | 'beauty'
  | 'business'
  | 'transportation'
  | 'tax-vita'
  | 'other';

export type TuitionModel =
  | 'state-funded-possible'
  | 'employer-sponsored'
  | 'tuition-plus-aid'
  | 'no-tuition-vita'
  | 'apprenticeship-low-tuition';

export interface ProgramCatalogItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: ProgramCategory;
  tuitionModel: TuitionModel;
  tuitionInfo: string;
  stripeProductId?: string;
  stripePriceIdFull?: string;
  stripePriceIdPaymentPlan?: string;
  featured: boolean;
  stateFundingPossible: boolean;
  earnWhileYouLearnPossible: boolean;
}

export const programCatalog: ProgramCatalogItem[] = [
  {
    id: 'prog-cna',
    slug: 'cna-training',
    name: 'CNA Training',
    shortDescription:
      'Hands-on nursing assistant training to prepare for entry-level roles in healthcare facilities.',
    category: 'healthcare',
    tuitionModel: 'tuition-plus-aid',
    tuitionInfo:
      'Tuition-based with potential employer sponsorship, scholarships, and payment plans. Not currently WRG-funded in your notes.',
    featured: true,
    stateFundingPossible: false,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-barber',
    slug: 'barber-apprenticeship',
    name: 'Barber Apprenticeship',
    shortDescription:
      'Apprenticeship pathway blending in-shop chair time with theory content and business skills.',
    category: 'beauty',
    tuitionModel: 'apprenticeship-low-tuition',
    tuitionInfo:
      'Typically low or no tuition; costs are mainly kits, licensing, and exams, often supported by employers and philanthropy.',
    featured: true,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-tax-vita',
    slug: 'tax-vita-track',
    name: 'Tax & VITA Track',
    shortDescription:
      'IRS-aligned VITA training for community tax preparation and seasonal tax roles.',
    category: 'tax-vita',
    tuitionModel: 'no-tuition-vita',
    tuitionInfo:
      'Usually grant-funded with no tuition; learners give service hours or seasonal work instead of paying.',
    featured: true,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-hvac',
    slug: 'hvac-technician',
    name: 'HVAC Technician Pathway',
    shortDescription:
      'Training for heating, ventilation, and air conditioning careers, with strong employer demand.',
    category: 'skilled-trades',
    tuitionModel: 'state-funded-possible',
    tuitionInfo:
      'Often eligible for WRG/WIOA and employer sponsorship; remaining costs can be covered by scholarships or payment plans.',
    featured: true,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-cdl',
    slug: 'cdl-training',
    name: 'CDL Training Pathway',
    shortDescription: "Commercial driver's license preparation for transportation careers.",
    category: 'transportation',
    tuitionModel: 'state-funded-possible',
    tuitionInfo:
      'Many carriers sponsor or reimburse CDL training. WRG/WIOA may apply depending on setup.',
    featured: true,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-business-apprentice',
    slug: 'business-support-apprenticeship',
    name: 'Business Support Apprenticeship',
    shortDescription:
      'Office, admin, and customer support roles with structured training and paid experience.',
    category: 'business',
    tuitionModel: 'state-funded-possible',
    tuitionInfo:
      'Mix of grants, employer sponsorship, and paid WEX/OJT placements. Usually little or no out-of-pocket tuition.',
    featured: false,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-ems-apprentice',
    slug: 'ems-healthcare-support-apprenticeship',
    name: 'EMS & Healthcare Support Apprenticeship',
    shortDescription: 'Apprenticeship-style pathway into EMS and healthcare support roles.',
    category: 'healthcare',
    tuitionModel: 'state-funded-possible',
    tuitionInfo:
      'Funding may include WRG/WIOA, employer sponsorship, and philanthropy; often paired with stipends.',
    featured: false,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-building-tech-apprentice',
    slug: 'building-maintenance-apprenticeship',
    name: 'Building Maintenance & Technician Apprenticeship',
    shortDescription:
      'Facilities, building maintenance, and technician roles for commercial and residential sites.',
    category: 'skilled-trades',
    tuitionModel: 'state-funded-possible',
    tuitionInfo: 'Strong candidate for WRG/WIOA plus employer-paid apprentice roles.',
    featured: false,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-culinary-apprentice',
    slug: 'culinary-kitchen-apprenticeship',
    name: 'Culinary & Kitchen Apprenticeship',
    shortDescription: 'Kitchen and culinary apprenticeships with real work experience.',
    category: 'other',
    tuitionModel: 'apprenticeship-low-tuition',
    tuitionInfo:
      'Primarily employer-paid roles with some costs for uniforms and tools, supported by philanthropy.',
    featured: false,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-esthetics-apprentice',
    slug: 'esthetics-apprenticeship',
    name: 'Esthetics Apprenticeship',
    shortDescription:
      'Spa-based apprenticeship for estheticians, combining hands-on practice with theory.',
    category: 'beauty',
    tuitionModel: 'apprenticeship-low-tuition',
    tuitionInfo:
      'Mix of employer sponsorship and small fees, with kits and licensing often supported by philanthropy.',
    featured: false,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
  {
    id: 'prog-nails-apprentice',
    slug: 'nail-technician-apprenticeship',
    name: 'Nail Technician Apprenticeship',
    shortDescription: 'Nail tech apprenticeships focused on salon-ready skills and sanitation.',
    category: 'beauty',
    tuitionModel: 'apprenticeship-low-tuition',
    tuitionInfo:
      'Employer-sponsored apprenticeship with kit and licensing costs supported by wraparound funds where possible.',
    featured: false,
    stateFundingPossible: true,
    earnWhileYouLearnPossible: true,
  },
];

export function getProgramBySlug(slug: string) {
  return programCatalog.find((p) => p.slug === slug);
}

export function getProgramById(id: string) {
  return programCatalog.find((p) => p.id === id);
}
