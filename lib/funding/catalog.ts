export type FundingProgram = {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  notes?: string;
  eligibility?: string;
  fundingAmount?: string;
};

export const FUNDING_PROGRAMS: FundingProgram[] = [
  {
    id: 'wioa-adult',
    name: 'WIOA Adult',
    category: 'Federal Workforce',
    description:
      'Supports adults seeking employment, training, and education services through eligible training providers.',
    tags: ['adult', 'workforce', 'etpl', 'training'],
    eligibility: 'Adults 18+ who are unemployed or underemployed',
    fundingAmount: 'Varies by state/local area',
  },
  {
    id: 'wioa-youth',
    name: 'WIOA Youth',
    category: 'Federal Workforce',
    description:
      'Supports youth and young adults facing barriers to employment with education and training activities.',
    tags: ['youth', 'out-of-school', 'barriers', 'ages-14-24'],
    eligibility: 'Youth ages 14-24 facing barriers to employment',
    fundingAmount: 'Varies by state/local area',
  },
  {
    id: 'wioa-dislocated',
    name: 'WIOA Dislocated Worker',
    category: 'Federal Workforce',
    description:
      'Supports workers who have been laid off or displaced with retraining and career services.',
    tags: ['dislocated', 'laid-off', 'retraining', 'adult'],
    eligibility: 'Workers who have been laid off or received notice',
    fundingAmount: 'Varies by state/local area',
  },
  {
    id: 'apprenticeship-state',
    name: 'State Apprenticeship Expansion Grants',
    category: 'Apprenticeship',
    description:
      'Funds the creation and expansion of registered apprenticeship and pre-apprenticeship programs.',
    tags: ['apprenticeship', 'barber', 'hvac', 'construction', 'healthcare'],
    eligibility: 'Registered apprenticeship sponsors',
    fundingAmount: '$50,000 - $500,000 per program',
  },
  {
    id: 'career-tech-ed',
    name: 'Career & Technical Education (Perkins)',
    category: 'Education',
    description:
      'Supports CTE programs that prepare learners for high-skill, high-wage, in-demand occupations.',
    tags: ['cte', 'career-tech', 'high-school', 'dual-credit', 'postsecondary'],
    eligibility: 'Secondary and postsecondary institutions',
    fundingAmount: 'Formula-based allocation',
  },
  {
    id: 'pell-grant',
    name: 'Federal Pell Grant',
    category: 'Education',
    description:
      'Need-based grants for low-income undergraduate and certain post-baccalaureate students.',
    tags: ['financial-aid', 'undergraduate', 'low-income'],
    eligibility: 'Low-income students pursuing eligible programs',
    fundingAmount: 'Up to $7,395 per year (2024-25)',
  },
  {
    id: 'trade-adjustment',
    name: 'Trade Adjustment Assistance (TAA)',
    category: 'Federal Workforce',
    description: 'Provides training and support for workers who lost jobs due to foreign trade.',
    tags: ['dislocated', 'trade', 'retraining', 'manufacturing'],
    eligibility: 'Workers certified as trade-affected',
    fundingAmount: 'Up to 130 weeks of training',
  },
  {
    id: 'snap-e-t',
    name: 'SNAP Employment & Training',
    category: 'Federal Workforce',
    description: 'Helps SNAP recipients gain skills and find employment through training programs.',
    tags: ['snap', 'low-income', 'workforce', 'training'],
    eligibility: 'SNAP recipients ages 16-59',
    fundingAmount: 'Varies by state',
  },
  {
    id: 'tanf',
    name: 'Temporary Assistance for Needy Families (TANF)',
    category: 'Federal Workforce',
    description: 'Provides work activities and training for low-income families with children.',
    tags: ['tanf', 'low-income', 'families', 'workforce'],
    eligibility: 'Low-income families with dependent children',
    fundingAmount: 'Varies by state',
  },
  {
    id: 'second-chance',
    name: 'Second Chance Act Grants',
    category: 'Reentry',
    description: 'Supports reentry programs for individuals returning from incarceration.',
    tags: ['reentry', 'justice-involved', 'barriers', 'workforce'],
    eligibility: 'Organizations serving justice-involved individuals',
    fundingAmount: '$500,000 - $1,000,000 per grant',
  },
  {
    id: 'youthbuild',
    name: 'YouthBuild',
    category: 'Youth',
    description:
      'Provides education, occupational skills training, and employment opportunities for at-risk youth.',
    tags: ['youth', 'construction', 'education', 'barriers'],
    eligibility: 'Youth ages 16-24 who are school dropouts',
    fundingAmount: '$700,000 - $1,100,000 per grant',
  },
  {
    id: 'job-corps',
    name: 'Job Corps',
    category: 'Youth',
    description: 'Free education and vocational training program for young people ages 16-24.',
    tags: ['youth', 'residential', 'vocational', 'education'],
    eligibility: 'Youth ages 16-24 who meet income requirements',
    fundingAmount: 'Fully funded program',
  },
];
