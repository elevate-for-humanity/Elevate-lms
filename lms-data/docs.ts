import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export type DocumentCategory =
  | 'dol-strategy'
  | 'wioa-wrg-jri'
  | 'funding-playbooks'
  | 'employer-mous'
  | 'credential-partners'
  | 'irs-vita'
  | 'intake-forms'
  | 'templates-scripts'
  | 'compliance-policies';

export interface Document {
  id: string;
  category: DocumentCategory;
  title: string;
  description: string;
  url: string; // path to PDF or external link
  tags: string[];
  dateAdded?: string;
  isExternal?: boolean; // true if linking to external site
}

export interface DocumentCategoryInfo {
  id: DocumentCategory;
  title: string;
  description: string;
  icon: string;
}

/**
 * Document categories for the internal library
 */
export const documentCategories: DocumentCategoryInfo[] = [
  {
    id: 'dol-strategy',
    title: 'DOL Guidance & Strategy',
    description: "TEGLs, America's Talent Strategy, and federal workforce policy updates.",
    icon: '📋',
  },
  {
    id: 'wioa-wrg-jri',
    title: 'WIOA / WRG / JRI',
    description: 'Workforce Ready Grant, WIOA eligibility, Job Ready Indy (JRI) hosting docs.',
    icon: '💼',
  },
  {
    id: 'funding-playbooks',
    title: 'Funding Playbooks',
    description: 'Internal guides for WEX, OJT, apprenticeships, and how to layer funding streams.',
    icon: '💰',
  },
  {
    id: 'employer-mous',
    title: 'Employer MOUs & Agreements',
    description: 'Templates and signed MOUs for employer partnerships, WEX/OJT placements.',
    icon: '🤝',
  },
  {
    id: 'credential-partners',
    title: 'Credential Partner Docs',
    description:
      'Milady, HSI, CareerSafe, Certiport, Rise, National Drug Screening agreements and guides.',
    icon: '🎓',
  },
  {
    id: 'irs-vita',
    title: 'IRS VITA & Tax',
    description: 'IRS VITA certification requirements, Link & Learn Tax, Intuit ProConnect guides.',
    icon: '📊',
  },
  {
    id: 'intake-forms',
    title: 'Intake & Referral Forms',
    description:
      'Student intake, WIOA eligibility checklists, referral forms for WorkOne/EmployIndy.',
    icon: '📝',
  },
  {
    id: 'templates-scripts',
    title: 'Templates & Scripts',
    description: 'Email templates, pitch decks, talking points for funders and employers.',
    icon: '📄',
  },
  {
    id: 'compliance-policies',
    title: 'Compliance & Policies',
    description: 'Data privacy, FERPA, background checks, safety protocols, and internal policies.',
    icon: '🔒',
  },
];

/**
 * Document library
 * Add your real PDFs and links here as you build out the library
 */
export const documents: Document[] = [
  // DOL Strategy
  {
    id: 'doc-tegl-05-25',
    category: 'dol-strategy',
    title: "TEGL 05-25 – America's Talent Strategy & Waiver Flexibility",
    description:
      'DOL guidance encouraging innovation, waivers, and modernization of WIOA programs.',
    url: 'https://wdr.doleta.gov/directives/attach/TEGL/TEGL_05-25.pdf',
    tags: ['DOL', 'TEGL', 'Waivers', 'Innovation'],
    isExternal: true,
  },
  {
    id: 'doc-americas-talent-strategy',
    category: 'dol-strategy',
    title: "America's Talent Strategy Overview",
    description: "High-level summary of DOL's vision for workforce development modernization.",
    url: 'https://www.dol.gov/agencies/eta/americastalent',
    tags: ['DOL', 'Strategy'],
    isExternal: true,
  },

  // WIOA / WRG / JRI
  {
    id: 'doc-wrg-overview',
    category: 'wioa-wrg-jri',
    title: 'WRG Employer Overview – ' + PLATFORM_DEFAULTS.orgName + '',
    description: '1-page overview of how Workforce Ready Grant works with Elevate programs.',
    url: '/docs/funding/wrg-employer-overview.pdf',
    tags: ['WRG', 'Employer'],
  },
  {
    id: 'doc-jri-hosting',
    category: 'wioa-wrg-jri',
    title: 'Job Ready Indy (JRI) – Hosting on Your Own LMS',
    description: 'Guide for how Elevate hosts JRI SCORM content and tracks completion.',
    url: '/docs/funding/jri-hosting-guide.pdf',
    tags: ['JRI', 'SCORM', 'LMS'],
  },
  {
    id: 'doc-wioa-eligibility',
    category: 'wioa-wrg-jri',
    title: 'WIOA Eligibility Checklist',
    description: 'Quick reference for Adult, Youth, and Dislocated Worker eligibility.',
    url: '/docs/funding/wioa-eligibility-checklist.pdf',
    tags: ['WIOA', 'Eligibility'],
  },

  // Funding Playbooks
  {
    id: 'doc-funding-playbook-staff',
    category: 'funding-playbooks',
    title: 'Internal Staff Funding Playbook',
    description: 'How to layer WIOA, WRG, WEX, OJT, and apprenticeships for each program.',
    url: '/admin/funding-playbook',
    tags: ['Funding', 'WEX', 'OJT', 'Apprenticeship'],
  },
  {
    id: 'doc-wex-ojt-guide',
    category: 'funding-playbooks',
    title: 'WEX vs OJT – When to Use Each',
    description: 'Decision tree for recommending Work Experience vs On-the-Job Training.',
    url: '/docs/funding/wex-vs-ojt-guide.pdf',
    tags: ['WEX', 'OJT'],
  },

  // Employer MOUs
  {
    id: 'doc-employer-mou-template',
    category: 'employer-mous',
    title: 'Employer MOU Template (WEX/OJT)',
    description: 'Standard MOU template for employer partnerships with Elevate.',
    url: '/docs/employers/employer-mou-template.pdf',
    tags: ['MOU', 'Employer', 'Template'],
  },
  {
    id: 'doc-apprenticeship-agreement',
    category: 'employer-mous',
    title: 'Apprenticeship Employer Agreement',
    description: 'Agreement template for registered apprenticeship host employers.',
    url: '/docs/employers/apprenticeship-agreement-template.pdf',
    tags: ['Apprenticeship', 'MOU', 'Employer'],
  },

  // Credential Partners
  {
    id: 'doc-milady-agreement',
    category: 'credential-partners',
    title: 'Milady Partnership Agreement',
    description: 'Agreement and access guide for Milady beauty/barber content.',
    url: '/docs/credentials/milady-partnership.pdf',
    tags: ['Milady', 'Barber', 'Beauty'],
  },
  {
    id: 'doc-hsi-careersafe',
    category: 'credential-partners',
    title: 'HSI & CareerSafe OSHA 10/30 Guide',
    description: 'How to provision OSHA 10/30 credentials through HSI and CareerSafe.',
    url: '/docs/credentials/hsi-careersafe-guide.pdf',
    tags: ['HSI', 'CareerSafe', 'OSHA'],
  },

  // Intake Forms
  {
    id: 'doc-student-intake',
    category: 'intake-forms',
    title: 'Student Intake & Enrollment Form',
    description: 'Standard intake form for new students entering Elevate programs.',
    url: '/docs/forms/student-intake-form.pdf',
    tags: ['Intake', 'Enrollment'],
  },
  {
    id: 'doc-workone-referral',
    category: 'intake-forms',
    title: 'WorkOne / EmployIndy Referral Form',
    description: 'Form for referring students to/from WorkOne and EmployIndy partners.',
    url: '/docs/forms/workone-referral-form.pdf',
    tags: ['WorkOne', 'EmployIndy', 'Referral'],
  },

  // Templates & Scripts
  {
    id: 'doc-employer-pitch',
    category: 'templates-scripts',
    title: 'Employer Pitch Deck – Elevate Partnerships',
    description: 'Slide deck for pitching WEX/OJT/apprenticeship partnerships to employers.',
    url: '/docs/templates/employer-pitch-deck.pdf',
    tags: ['Employer', 'Pitch', 'Template'],
  },
  {
    id: 'doc-funder-talking-points',
    category: 'templates-scripts',
    title: 'Funder Talking Points – Innovation Waiver Pilot',
    description: 'Talking points for pitching an innovation waiver pilot to workforce boards.',
    url: '/docs/templates/funder-talking-points.pdf',
    tags: ['Funder', 'Waiver', 'Pitch'],
  },

  // Compliance & Policies
  {
    id: 'doc-ferpa-policy',
    category: 'compliance-policies',
    title: 'FERPA & Data Privacy Policy',
    description: "Elevate's policy for protecting student education records and data.",
    url: '/docs/policies/ferpa-data-privacy.pdf',
    tags: ['FERPA', 'Privacy', 'Compliance'],
  },
  {
    id: 'doc-background-check',
    category: 'compliance-policies',
    title: 'Background Check & Safety Protocol',
    description: 'Requirements for background checks and safety protocols for students and staff.',
    url: '/docs/policies/background-check-safety.pdf',
    tags: ['Background Check', 'Safety', 'Compliance'],
  },
];

export function getDocumentsByCategory(category: DocumentCategory): Document[] {
  return documents.filter((doc) => doc.category === category);
}

export function getCategoryInfo(category: DocumentCategory): DocumentCategoryInfo | undefined {
  return documentCategories.find((cat) => cat.id === category);
}
