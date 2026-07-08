import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * SEO Authority Hub Route Registry
 *
 * Canonical slugs, metadata, keyword clusters, schema types, and compliance
 * flags for all 7 local/buyer-intent SEO hubs.
 *
 * Target searches:
 *   - WIOA training Indiana
 *   - funded job training Indianapolis
 *   - CNA training Indianapolis
 *   - HVAC training Indianapolis
 *   - apprenticeship sponsor Indiana
 *   - employer OJT partner Indiana
 *   - agency referral workforce training Indiana
 */

export interface SeoHubConfig {
  /** Canonical URL path */
  slug: string;
  /** <title> tag */
  title: string;
  /** <meta name="description"> */
  description: string;
  /** Open Graph title */
  ogTitle: string;
  /** Open Graph description */
  ogDescription: string;
  /** Primary keyword cluster */
  keywords: string[];
  /** Related program category slugs */
  programCategories: string[];
  /** Internal links shown in navigation/cross-links */
  internalLinks: { label: string; href: string }[];
  /** Schema.org @type values to emit on this page */
  schemaTypes: string[];
  /** Whether to include the WIOA/funding eligibility disclaimer */
  fundingDisclaimer: boolean;
  /** Whether to include the third-party credential disclaimer */
  credentialDisclaimer: boolean;
  /** Whether to include the "not a degree-granting institution" statement */
  notDegreeGranting: boolean;
  /** Whether to include the "final eligibility by agency" disclaimer */
  agencyEligibilityDisclaimer: boolean;
}

const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

export const SEO_HUBS: SeoHubConfig[] = [
  // ──────────────────────────────────────────────────────────────────────
  // 1. Main Authority Hub
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: '/workforce-training-indianapolis',
    title: 'Workforce Training Indianapolis | Funded Career Certifications | Elevate for Humanity',
    description:
      'Indianapolis workforce training provider. WIOA-funded, state-approved career certifications in healthcare, skilled trades, and IT. Serving Indianapolis and all of Indiana.',
    ogTitle: 'Workforce Training Indianapolis | ' + PLATFORM_DEFAULTS.orgName + '',
    ogDescription:
      'WIOA-funded career training in healthcare, skilled trades, and IT. Indianapolis and Indiana-wide. Employer placement pipeline. Agency referrals accepted.',
    keywords: [
      'workforce training Indianapolis',
      'job training Indianapolis',
      'career training Indiana',
      'no-cost job training Indianapolis',
      'funded career training Indiana',
      'adult education workforce training Indiana',
      'WIOA training Indianapolis',
      'certified workforce training provider Indiana',
    ],
    programCategories: ['healthcare', 'skilled-trades', 'technology', 'business'],
    internalLinks: [
      { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
      { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
      { label: 'Skilled Trades Programs', href: '/skilled-trades-training-indiana' },
      { label: 'IT & Digital Skills', href: '/it-certification-training-indianapolis' },
      { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
      { label: 'Agency Referrals', href: '/agency-referral-workforce-training-indiana' },
      { label: 'All Programs', href: '/programs' },
      { label: 'Apply Now', href: '/apply' },
    ],
    schemaTypes: ['EducationalOrganization', 'LocalBusiness', 'BreadcrumbList'],
    fundingDisclaimer: true,
    credentialDisclaimer: true,
    notDegreeGranting: true,
    agencyEligibilityDisclaimer: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // 2. WIOA / Funding Hub
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: '/wioa-funded-training-indiana',
    title: 'WIOA Funded Training Indiana | Free Job Training Indianapolis | Elevate for Humanity',
    description:
      'Understand WIOA funding for career training in Indiana. Workforce Ready Grant, FSSA IMPACT, WorkOne referrals. Eligibility determined by your local workforce agency.',
    ogTitle: 'WIOA Funded Training Indiana | ' + PLATFORM_DEFAULTS.orgName + '',
    ogDescription:
      'WIOA-funded career training in Indiana. WorkOne referrals accepted. Workforce Ready Grant and FSSA IMPACT eligible programs. Eligibility determined by your agency.',
    keywords: [
      'WIOA training Indiana',
      'WIOA funded training Indianapolis',
      'Workforce Ready Grant training',
      'FSSA IMPACT training Indiana',
      'free job training Indiana',
      'WorkOne training provider Indiana',
      'no-cost career training Indianapolis',
      'funded workforce training Indiana',
    ],
    programCategories: ['healthcare', 'skilled-trades', 'technology'],
    internalLinks: [
      { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
      { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
      { label: 'Skilled Trades Programs', href: '/skilled-trades-training-indiana' },
      { label: 'IT & Digital Skills', href: '/it-certification-training-indianapolis' },
      { label: 'Agency Referrals', href: '/agency-referral-workforce-training-indiana' },
      { label: 'How Funding Works', href: '/funding/how-it-works' },
      { label: 'Apply Now', href: '/apply' },
      { label: 'Contact Us', href: '/contact' },
    ],
    schemaTypes: ['EducationalOrganization', 'FAQPage', 'BreadcrumbList'],
    fundingDisclaimer: true,
    credentialDisclaimer: false,
    notDegreeGranting: true,
    agencyEligibilityDisclaimer: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // 3. Healthcare Training Hub
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: '/healthcare-training-indianapolis',
    title: 'Healthcare Training Indianapolis | CNA, HHA & Medical Assistant | Elevate for Humanity',
    description:
      'CNA, HHA, Medical Assistant, and Patient Care Technician training in Indianapolis. State-approved programs. WIOA funding may be available for eligible Indiana residents.',
    ogTitle: 'Healthcare Training Indianapolis | CNA, HHA & Medical Assistant',
    ogDescription:
      'CNA, HHA, Medical Assistant, Phlebotomy, and Patient Care Tech training in Indianapolis. State-approved. WIOA funding may be available.',
    keywords: [
      'CNA training Indianapolis',
      'HHA training Indiana',
      'medical assistant training Indianapolis',
      'phlebotomy training Indianapolis',
      'healthcare certification Indiana',
      'patient care technician training Indianapolis',
      'nursing assistant training Indianapolis',
      'healthcare workforce training Indiana',
    ],
    programCategories: ['healthcare'],
    internalLinks: [
      { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
      { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
      { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
      { label: 'CNA Program', href: '/programs/cna' },
      { label: 'Healthcare Programs', href: '/programs/healthcare' },
      { label: 'Apply Now', href: '/apply' },
    ],
    schemaTypes: ['EducationalOrganization', 'Course', 'FAQPage', 'BreadcrumbList'],
    fundingDisclaimer: true,
    credentialDisclaimer: true,
    notDegreeGranting: true,
    agencyEligibilityDisclaimer: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // 4. Skilled Trades Hub
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: '/skilled-trades-training-indiana',
    title: 'Skilled Trades Training Indiana | HVAC, Electrical & Apprenticeships | Elevate for Humanity',
    description:
      'HVAC, electrical, construction, OSHA, and EPA 608 training in Indiana. DOL-registered apprenticeship sponsor. Employer OJT and work-based learning pathway available.',
    ogTitle: 'Skilled Trades Training Indiana | HVAC, Electrical & Apprenticeships',
    ogDescription:
      'HVAC, electrical, construction, OSHA, and EPA 608 training in Indiana. DOL-registered apprenticeship sponsor. OJT and work-based learning available.',
    keywords: [
      'HVAC training Indianapolis',
      'electrical training Indianapolis',
      'OSHA training Indiana',
      'construction training Indianapolis',
      'apprenticeship training Indiana',
      'EPA 608 training Indiana',
      'skilled trades certification Indiana',
      'registered apprenticeship sponsor Indiana',
    ],
    programCategories: ['skilled-trades'],
    internalLinks: [
      { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
      { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
      { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
      { label: 'HVAC Technician Program', href: '/programs/hvac-technician' },
      { label: 'Apprenticeships', href: '/apprenticeships' },
      { label: 'Apply Now', href: '/apply' },
    ],
    schemaTypes: ['EducationalOrganization', 'Course', 'FAQPage', 'BreadcrumbList'],
    fundingDisclaimer: true,
    credentialDisclaimer: true,
    notDegreeGranting: true,
    agencyEligibilityDisclaimer: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // 5. IT / Digital Skills Hub
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: '/it-certification-training-indianapolis',
    title: 'IT Certification Training Indianapolis | CompTIA, Cybersecurity & Digital Skills | Elevate for Humanity',
    description:
      'CompTIA, Microsoft, cybersecurity, and digital skills training in Indianapolis. Industry-recognized certifications. WIOA funding may be available for eligible Indiana residents.',
    ogTitle: 'IT Certification Training Indianapolis | CompTIA & Cybersecurity',
    ogDescription:
      'CompTIA, Microsoft, cybersecurity, and digital literacy training in Indianapolis. Industry certifications. WIOA funding may be available for qualifying residents.',
    keywords: [
      'CompTIA training Indianapolis',
      'IT certification training Indiana',
      'Microsoft certification training Indianapolis',
      'cybersecurity training Indiana',
      'digital skills training Indianapolis',
      'IT help desk training Indianapolis',
      'network+ training Indiana',
      'A+ certification training Indianapolis',
    ],
    programCategories: ['technology'],
    internalLinks: [
      { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
      { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
      { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
      { label: 'IT Help Desk Program', href: '/programs/it-help-desk' },
      { label: 'Cybersecurity Program', href: '/programs/cybersecurity-analyst' },
      { label: 'Apply Now', href: '/apply' },
    ],
    schemaTypes: ['EducationalOrganization', 'Course', 'FAQPage', 'BreadcrumbList'],
    fundingDisclaimer: true,
    credentialDisclaimer: true,
    notDegreeGranting: true,
    agencyEligibilityDisclaimer: true,
  },

  // ──────────────────────────────────────────────────────────────────────
  // 6. Employer / OJT Hub
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: '/employer-workforce-partnerships-indiana',
    title: 'Employer Workforce Partnerships Indiana | OJT, Apprenticeships & Wage Reimbursement | Elevate for Humanity',
    description:
      'Partner with Elevate for Humanity for OJT wage reimbursement, registered apprenticeships, WOTC tax credits, and trained workforce candidates across Indiana.',
    ogTitle: 'Employer Workforce Partnerships Indiana | OJT & Apprenticeships',
    ogDescription:
      'OJT wage reimbursement, registered apprenticeships, WOTC tax credits, and trained candidates. Partner with Indiana\'s workforce training provider.',
    keywords: [
      'OJT employer partnerships Indiana',
      'workforce training partners Indianapolis',
      'hire trained workers Indiana',
      'apprenticeship sponsor Indiana',
      'Work Opportunity Tax Credit Indiana',
      'on-the-job training reimbursement Indiana',
      'employer OJT partner Indiana',
      'workforce development partner Indianapolis',
    ],
    programCategories: ['healthcare', 'skilled-trades', 'technology'],
    internalLinks: [
      { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
      { label: 'Agency Referrals', href: '/agency-referral-workforce-training-indiana' },
      { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
      { label: 'Skilled Trades Programs', href: '/skilled-trades-training-indiana' },
      { label: 'IT Programs', href: '/it-certification-training-indianapolis' },
      { label: 'All Programs', href: '/programs' },
      { label: 'Contact Us', href: '/contact' },
    ],
    schemaTypes: ['Organization', 'Service', 'FAQPage', 'BreadcrumbList'],
    fundingDisclaimer: true,
    credentialDisclaimer: false,
    notDegreeGranting: false,
    agencyEligibilityDisclaimer: false,
  },

  // ──────────────────────────────────────────────────────────────────────
  // 7. Agency / Referral Hub
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: '/agency-referral-workforce-training-indiana',
    title: 'Agency Referral Workforce Training Indiana | WorkOne & FSSA IMPACT Partner | Elevate for Humanity',
    description:
      'Workforce agency referral partner in Indiana. WorkOne referrals accepted. FSSA IMPACT training provider. ETPL-approved. WIOA-compliant documentation and outcome reporting available.',
    ogTitle: 'Agency Referral Workforce Training Indiana | WorkOne & FSSA IMPACT',
    ogDescription:
      'Indiana workforce agency referral partner. WorkOne referrals, FSSA IMPACT, ETPL-approved, WIOA-compliant. Outcome tracking and participant support services.',
    keywords: [
      'workforce referral partner Indiana',
      'agency referral training Indianapolis',
      'FSSA IMPACT training provider',
      'WorkOne training provider Indiana',
      'reentry workforce training Indiana',
      'ETPL approved training provider Indiana',
      'WIOA training provider Indianapolis',
      'case manager referral workforce Indiana',
    ],
    programCategories: ['healthcare', 'skilled-trades', 'technology'],
    internalLinks: [
      { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
      { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
      { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
      { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
      { label: 'Skilled Trades Programs', href: '/skilled-trades-training-indiana' },
      { label: 'All Programs', href: '/programs' },
      { label: 'Contact Us', href: '/contact' },
    ],
    schemaTypes: ['EducationalOrganization', 'Service', 'FAQPage', 'BreadcrumbList'],
    fundingDisclaimer: true,
    credentialDisclaimer: true,
    notDegreeGranting: true,
    agencyEligibilityDisclaimer: true,
  },
];

/** Look up a hub by its slug. Returns undefined if not found. */
export function getSeoHub(slug: string): SeoHubConfig | undefined {
  return SEO_HUBS.find(h => h.slug === slug);
}

/** Canonical absolute URL for a hub slug */
export function hubUrl(slug: string): string {
  return `${SITE_URL}${slug}`;
}
