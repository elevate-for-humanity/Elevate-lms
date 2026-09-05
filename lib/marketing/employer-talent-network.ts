export const EMPLOYER_NETWORK_REGIONS = [
  { slug: 'indianapolis', city: 'Indianapolis', county: 'Marion County' },
  { slug: 'fort-wayne', city: 'Fort Wayne', county: 'Allen County' },
  { slug: 'south-bend', city: 'South Bend', county: 'St. Joseph County' },
  { slug: 'evansville', city: 'Evansville', county: 'Vanderburgh County' },
] as const;

export type EmployerTalentPathway = {
  slug: string;
  programSlug: string;
  name: string;
  audience: string;
  summary: string;
  training: string[];
  roles: string[];
  industry: string;
  accent: string;
};

export const EMPLOYER_TALENT_PATHWAYS: EmployerTalentPathway[] = [
  {
    slug: 'cdl',
    programSlug: 'cdl-training',
    name: 'CDL & Transportation',
    audience: 'Carriers, logistics companies, delivery fleets, and transportation employers',
    summary:
      'Connect with candidates completing an accelerated Class A and Class B commercial-driving pathway with licensing preparation and career support.',
    training: [
      'CDL knowledge and regulations',
      'Pre-trip inspection',
      'Vehicle control and on-road practice',
    ],
    roles: [
      'Entry-level commercial driver',
      'Local or regional driver',
      'Delivery and fleet driver',
    ],
    industry: 'transportation',
    accent: 'from-blue-950 to-slate-950',
  },
  {
    slug: 'bookkeeping',
    programSlug: 'bookkeeping',
    name: 'Bookkeeping & QuickBooks',
    audience: 'Accounting firms, nonprofits, small businesses, and finance teams',
    summary:
      'Meet candidates trained in bookkeeping fundamentals, QuickBooks Online, reconciliation, reporting, payroll basics, and Excel.',
    training: [
      'Double-entry bookkeeping',
      'QuickBooks Online workflows',
      'Reconciliation and financial reports',
    ],
    roles: [
      'Bookkeeping assistant',
      'Accounts payable/receivable clerk',
      'Administrative finance support',
    ],
    industry: 'bookkeeping',
    accent: 'from-emerald-950 to-slate-950',
  },
  {
    slug: 'business-administration',
    programSlug: 'business-administration',
    name: 'Business Administration',
    audience: 'Small businesses, retailers, service companies, and office teams',
    summary:
      'Connect with candidates building practical skills in customer service, sales, business operations, retail, and business finance.',
    training: [
      'Customer service and sales',
      'Business and retail operations',
      'Pricing, cash flow, and business math',
    ],
    roles: [
      'Administrative assistant',
      'Customer service specialist',
      'Retail or operations associate',
    ],
    industry: 'business',
    accent: 'from-amber-950 to-slate-950',
  },
  {
    slug: 'web-development',
    programSlug: 'web-development',
    name: 'Web Design & Development',
    audience: 'Agencies, small businesses, nonprofits, and digital teams',
    summary:
      'Meet candidates developing portfolio-based skills in responsive websites, front-end code, content management, testing, and deployment workflows.',
    training: [
      'HTML, CSS, and JavaScript',
      'Responsive web design',
      'Website content and deployment workflows',
    ],
    roles: ['Junior web developer', 'Website content assistant', 'Digital production assistant'],
    industry: 'technology',
    accent: 'from-violet-950 to-slate-950',
  },
  {
    slug: 'it-help-desk',
    programSlug: 'it-help-desk',
    name: 'IT Help Desk',
    audience: 'Managed service providers, schools, healthcare offices, and internal IT teams',
    summary:
      'Connect with candidates trained in hardware, operating systems, networking, security fundamentals, ticketing, and customer support.',
    training: [
      'Hardware and operating systems',
      'Networking and security fundamentals',
      'Ticketing, documentation, and user support',
    ],
    roles: ['Help desk technician', 'Desktop support assistant', 'IT support specialist'],
    industry: 'information-technology',
    accent: 'from-cyan-950 to-slate-950',
  },
];

export function getEmployerTalentPathway(slug: string) {
  return EMPLOYER_TALENT_PATHWAYS.find((pathway) => pathway.slug === slug);
}
