export type CareerTrainingArea = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  programs: string[];
  ctaHref: string;
};

export const careerTrainingAreas: CareerTrainingArea[] = [
  {
    slug: 'healthcare',
    title: 'Healthcare',
    summary: 'Entry-level healthcare credentials with clinical training.',
    description:
      'Programs in CNA (FSSA funded), phlebotomy, medical assisting, home health aide, and emergency health safety. Funding varies by program — FSSA, WIOA, and self-pay options available.',
    programs: [
      'Certified Nursing Assistant (CNA)',
      'Phlebotomy Technician',
      'Medical Assistant',
      'Home Health Aide',
      'Emergency Health & Safety Technician',
    ],
    ctaHref: '/apply',
  },
  {
    slug: 'skilled-trades',
    title: 'Skilled Trades',
    summary: 'Hands-on trades training with industry credentials.',
    description:
      'Programs in HVAC, welding, electrical, plumbing, CDL, and construction trades. Graduate with OSHA, NCCER, and trade-specific certifications.',
    programs: [
      'HVAC Technician',
      'Welding Technology',
      'Electrical Technician',
      'Plumbing Technician',
      'CDL Class A',
      'Construction Trades Certification',
    ],
    ctaHref: '/apply',
  },
  {
    slug: 'beauty-wellness',
    title: 'Beauty & Wellness',
    summary: 'Licensed and non-licensure beauty career pathways.',
    description:
      'DOL Registered Apprenticeships in barbering, cosmetology, and nail technology. Non-licensure esthetician certificate. All programs include business and client service training.',
    programs: [
      'Barber Apprenticeship',
      'Cosmetology Apprenticeship',
      'Nail Technician Apprenticeship',
      'Professional Esthetician',
    ],
    ctaHref: '/apply',
  },
  {
    slug: 'technology',
    title: 'Technology',
    summary: 'IT and software credentials for career entry.',
    description:
      'Programs in cybersecurity, IT help desk, software development, web development, network administration, and CAD drafting. Prepare for CompTIA, Meta, and Microsoft certifications.',
    programs: [
      'Cybersecurity Analyst',
      'IT Help Desk Technician',
      'Software Development Foundations',
      'Web Development',
      'Network Administration',
      'CAD/Drafting Technician',
    ],
    ctaHref: '/apply',
  },
  {
    slug: 'business',
    title: 'Business & Finance',
    summary: 'Business credentials for office and entrepreneurship careers.',
    description:
      'Programs in bookkeeping, business administration, project management, entrepreneurship, and tax preparation. Prepare for QuickBooks, Microsoft Office, and Certiport certifications.',
    programs: [
      'Bookkeeping & QuickBooks',
      'Business Administration',
      'Project Management',
      'Entrepreneurship & Small Business',
      'Tax Preparation',
      'Office Administration',
    ],
    ctaHref: '/apply',
  },
];

export const statePages = [
  { slug: 'indiana', label: 'Indiana' },
  { slug: 'illinois', label: 'Illinois' },
  { slug: 'ohio', label: 'Ohio' },
  { slug: 'tennessee', label: 'Tennessee' },
  { slug: 'texas', label: 'Texas' },
];
