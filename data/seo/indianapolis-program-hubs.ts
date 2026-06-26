/**
 * Program + city SEO hub configs (Indianapolis).
 * Rendered via IndianapolisProgramHubPage.
 */

import type {
  EmployerSection,
  FaqItem,
  FundingSection,
  HubHero,
  InternalLink,
  ProgramPathway,
  TrustBadge,
  WhoItem,
} from '@/components/seo/SeoAuthorityHubPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type IndianapolisProgramHubConfig = {
  slug: string;
  metadata: {
    title: string;
    description: string;
    ogTitle?: string;
    twitterDescription?: string;
  };
  breadcrumbLabel: string;
  sectorHub?: { label: string; href: string };
  programStructuredData: {
    name: string;
    description: string;
    category: string;
  };
  hero: HubHero;
  trustBadges: TrustBadge[];
  whoHeading: string;
  whoItems: WhoItem[];
  funding: FundingSection;
  pathwaysHeading: string;
  pathways: ProgramPathway[];
  employer?: EmployerSection;
  faqs: FaqItem[];
  relatedLinks: InternalLink[];
  complianceNotes: string[];
  ctaHeading: string;
  ctaSubtitle: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
};

const org = PLATFORM_DEFAULTS.orgName;

export const CNA_TRAINING_INDIANAPOLIS: IndianapolisProgramHubConfig = {
  slug: 'cna-training-indianapolis',
  metadata: {
    title: 'CNA Training Indianapolis | State-Supervised Nurse Aide Program',
    description:
      'CNA training in Indianapolis. ISDH-aligned nurse aide instruction, clinical hours, and WIOA funding pathways for eligible Indiana residents.',
    ogTitle: 'CNA Training Indianapolis | Certified Nursing Assistant',
  },
  breadcrumbLabel: 'CNA Training Indianapolis',
  sectorHub: { label: 'Healthcare Training Indianapolis', href: '/healthcare-training-indianapolis' },
  programStructuredData: {
    name: 'CNA Training Indianapolis',
    description:
      'Certified Nursing Assistant training in Indianapolis with ISDH-aligned curriculum and clinical components.',
    category: 'Healthcare',
  },
  hero: {
    tag: 'CNA · Indianapolis · Indiana',
    heading: 'CNA Training in Indianapolis',
    subtitle: `${org} delivers state-supervised Certified Nursing Assistant training for adults entering long-term care, hospital, and home health roles. WIOA and Workforce Ready Grant funding may be available for eligible residents.`,
    primaryCta: { label: 'Apply for CNA Training', href: '/apply?program=cna' },
    secondaryCta: { label: 'CNA Program Details', href: '/programs/cna' },
  },
  trustBadges: [
    { label: 'ISDH-Aligned Curriculum', detail: 'Indiana nurse aide training standards' },
    { label: 'ETPL Approved Provider', detail: 'Workforce funding eligible' },
    { label: 'Clinical Hours Included', detail: 'Approved facility rotations' },
    { label: 'Employer Placement Support', detail: 'Indianapolis healthcare network' },
  ],
  whoHeading: 'Who CNA Training Is For',
  whoItems: [
    {
      heading: 'First-Time Healthcare Workers',
      description:
        'Adults 18+ with no clinical background who want a short pathway into patient care employment in Marion County and across Indiana.',
    },
    {
      heading: 'WorkOne & WIOA Referrals',
      description:
        'Participants referred by WorkOne or workforce agencies for high-demand healthcare credentials. We coordinate with your case manager on enrollment timing.',
    },
    {
      heading: 'Career Changers',
      description:
        'Workers leaving retail, hospitality, or other industries who need a stable CNA credential for Indiana healthcare employers.',
    },
  ],
  funding: {
    heading: 'Funding CNA Training in Indianapolis',
    paragraphs: [
      `CNA programs at ${org} are listed on Indiana's ETPL, which allows eligible participants to use WIOA Individual Training Accounts and other workforce funding when approved by WorkOne.`,
      'Healthcare support roles remain a priority sector in Indiana workforce plans. Your local WorkOne office determines final eligibility — not the training provider.',
    ],
    bullets: [
      'WIOA Title I — adults and dislocated workers',
      'Workforce Ready Grant — when CNA is on the eligible credential list',
      'FSSA Gov Portal — qualifying public-assistance referrals',
      'Job Ready Indy — Marion County residents',
      'Self-pay and payment plans when funding is not available',
    ],
    eligibilityNote:
      'Funding approval is issued by WorkOne or the referring agency. Contact WorkOne Indianapolis or our admissions team to start eligibility screening.',
  },
  pathwaysHeading: 'Related Healthcare Pathways',
  pathways: [
    {
      name: 'Home Health Aide (HHA)',
      description: 'Direct-care training for in-home health support roles.',
      href: '/programs/cna',
    },
    {
      name: 'Medical Assistant',
      description: 'Clinical and administrative skills for outpatient settings.',
      href: '/programs/healthcare',
    },
    {
      name: 'All Healthcare Programs',
      description: 'Full healthcare catalog at Elevate.',
      href: '/programs/healthcare',
    },
  ],
  employer: {
    heading: 'CNA Employers in Indianapolis',
    paragraphs: [
      'We connect CNA graduates with long-term care, hospital, and home health employers across the Indianapolis metro.',
      'Employers may coordinate OJT reimbursement or incumbent-worker training through workforce partnerships.',
    ],
    bullets: [
      'Pre-screened CNA candidates',
      'OJT reimbursement coordination for eligible partners',
      'No recruiting fee for partner employers',
    ],
    cta: { label: 'Employer Partnership Inquiry', href: '/employer-workforce-partnerships-indiana' },
  },
  faqs: [
    {
      question: 'How long is CNA training in Indianapolis?',
      answer:
        'Program length follows Indiana State Department of Health training hour requirements and includes classroom, lab, and clinical components. See the CNA program page for the current schedule.',
    },
    {
      question: 'Who issues the CNA credential?',
      answer:
        'Indiana CNA certification is issued through the state registry process after passing the Nurse Aide Competency Evaluation — not by the training provider.',
    },
    {
      question: 'Can WIOA pay for CNA classes?',
      answer:
        'Many eligible participants use WIOA funding for ETPL-approved CNA training. WorkOne determines eligibility and issues the training authorization.',
    },
  ],
  relatedLinks: [
    { label: 'Workforce Training Indianapolis', href: '/workforce-training-indianapolis' },
    { label: 'Healthcare Training Hub', href: '/healthcare-training-indianapolis' },
    { label: 'CNA Program Page', href: '/programs/cna' },
    { label: 'Funding Options', href: '/funding' },
    { label: 'Apply Now', href: '/apply?program=cna' },
  ],
  complianceNotes: [
    'CNA credentials are issued by Indiana state authorities through the competency evaluation process.',
    `${org} is a workforce training provider, not a degree-granting institution.`,
    'Employment and wages are not guaranteed.',
  ],
  ctaHeading: 'Start CNA Training in Indianapolis',
  ctaSubtitle: 'Apply today or speak with admissions about funding and start dates.',
  ctaPrimary: { label: 'Apply Now', href: '/apply?program=cna' },
  ctaSecondary: { label: 'View CNA Program', href: '/programs/cna' },
};

export const HVAC_TRAINING_INDIANAPOLIS: IndianapolisProgramHubConfig = {
  slug: 'hvac-training-indianapolis',
  metadata: {
    title: 'HVAC Training Indianapolis | EPA 608 & Trades Certification',
    description:
      'HVAC technician training in Indianapolis. Hands-on instruction, EPA 608 prep, OSHA safety, and WIOA-funded pathways for eligible Indiana residents.',
  },
  breadcrumbLabel: 'HVAC Training Indianapolis',
  sectorHub: { label: 'Skilled Trades Training Indiana', href: '/skilled-trades-training-indiana' },
  programStructuredData: {
    name: 'HVAC Training Indianapolis',
    description: 'HVAC technician training with EPA 608 certification preparation in Indianapolis.',
    category: 'Skilled Trades',
  },
  hero: {
    tag: 'HVAC · EPA 608 · Indianapolis',
    heading: 'HVAC Training in Indianapolis',
    subtitle: `Learn heating, cooling, and refrigeration fundamentals with hands-on labs and EPA 608 certification preparation. ${org} is a DOL-registered apprenticeship sponsor and ETPL-approved provider.`,
    primaryCta: { label: 'Apply for HVAC Training', href: '/apply?program=hvac-technician' },
    secondaryCta: { label: 'HVAC Program Details', href: '/programs/hvac-technician' },
  },
  trustBadges: [
    { label: 'EPA 608 Exam Prep', detail: 'Refrigerant handling certification path' },
    { label: 'DOL Apprenticeship Sponsor', detail: 'Earn-while-you-learn options' },
    { label: 'ETPL Approved', detail: 'WIOA referrals accepted' },
    { label: 'OSHA Safety Training', detail: 'Job-site readiness' },
  ],
  whoHeading: 'Who HVAC Training Is For',
  whoItems: [
    {
      heading: 'New Trades Entrants',
      description: 'Adults seeking a skilled trades career with strong demand in the Indianapolis construction and facilities market.',
    },
    {
      heading: 'Apprenticeship Candidates',
      description:
        'Learners who want related technical instruction paired with employer on-the-job training through registered apprenticeship.',
    },
    {
      heading: 'Workforce-Funded Participants',
      description: 'WorkOne and agency referrals for high-demand HVAC credentials.',
    },
  ],
  funding: {
    heading: 'Funding HVAC Training',
    paragraphs: [
      'Skilled trades occupations are commonly designated high-demand in Indiana, making HVAC training a frequent WIOA and Workforce Ready Grant target when eligibility is approved.',
      'Registered apprenticeship models may reduce out-of-pocket costs when an employer sponsors on-the-job training.',
    ],
    bullets: [
      'WIOA Individual Training Account',
      'Workforce Ready Grant',
      'Registered apprenticeship — paid OJT',
      'OJT wage reimbursement for eligible employers',
      'Self-pay and payment plans',
    ],
    eligibilityNote: 'WorkOne or your workforce agency determines funding eligibility.',
  },
  pathwaysHeading: 'Related Trades Pathways',
  pathways: [
    { name: 'Welding', description: 'Industrial welding and fabrication skills.', href: '/programs/welding' },
    { name: 'Electrical', description: 'Electrical systems and safety training.', href: '/programs/electrical' },
    { name: 'All Skilled Trades', description: 'Full trades catalog.', href: '/programs/skilled-trades' },
  ],
  employer: {
    heading: 'HVAC Employer Partners',
    paragraphs: [
      'Indianapolis HVAC contractors and facilities employers can hire apprentices or funded trainees through Elevate’s workforce pipeline.',
    ],
    bullets: ['EPA 608-ready candidates', 'Apprenticeship sponsorship support', 'OJT reimbursement coordination'],
    cta: { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
  },
  faqs: [
    {
      question: 'Is EPA 608 required for HVAC work?',
      answer:
        'Federal regulations require EPA Section 608 certification for technicians who purchase or handle regulated refrigerants. We prepare you for the exam; the certifying organization issues the credential.',
    },
    {
      question: 'Can I get HVAC training paid through WIOA?',
      answer:
        'Eligible participants often fund HVAC training through WIOA when the program is ETPL-approved and WorkOne authorizes the Individual Training Account.',
    },
  ],
  relatedLinks: [
    { label: 'Skilled Trades Hub', href: '/skilled-trades-training-indiana' },
    { label: 'HVAC Program', href: '/programs/hvac-technician' },
    { label: 'Apprenticeships', href: '/programs/apprenticeships' },
    { label: 'Apply Now', href: '/apply?program=hvac-technician' },
  ],
  complianceNotes: [
    'EPA 608 and OSHA credentials are issued by authorized certifying bodies, not by the training provider.',
    'Employment outcomes vary by market and individual performance.',
  ],
  ctaHeading: 'Start HVAC Training in Indianapolis',
  ctaSubtitle: 'Apply or contact admissions about funding and apprenticeship options.',
  ctaPrimary: { label: 'Apply Now', href: '/apply?program=hvac-technician' },
  ctaSecondary: { label: 'HVAC Program', href: '/programs/hvac-technician' },
};

export const CDL_TRAINING_INDIANAPOLIS: IndianapolisProgramHubConfig = {
  slug: 'cdl-training-indianapolis',
  metadata: {
    title: 'CDL Training Indianapolis | Class A Commercial Driver License',
    description:
      'CDL Class A training in Indianapolis and Indiana. Behind-the-wheel preparation, employer placement support, and workforce funding for eligible participants.',
  },
  breadcrumbLabel: 'CDL Training Indianapolis',
  sectorHub: { label: 'Skilled Trades Training Indiana', href: '/skilled-trades-training-indiana' },
  programStructuredData: {
    name: 'CDL Training Indianapolis',
    description: 'Commercial Driver License Class A training serving Indianapolis and Indiana.',
    category: 'Transportation',
  },
  hero: {
    tag: 'CDL Class A · Indianapolis',
    heading: 'CDL Training in Indianapolis',
    subtitle: `Prepare for a Class A commercial driver career with structured instruction and placement support. ${org} helps eligible participants navigate WIOA and state workforce funding.`,
    primaryCta: { label: 'Apply for CDL Training', href: '/apply?program=cdl-training' },
    secondaryCta: { label: 'CDL Program Details', href: '/programs/cdl-training' },
  },
  trustBadges: [
    { label: 'Class A CDL Pathway', detail: 'Long-haul and regional freight' },
    { label: 'ETPL Approved', detail: 'Workforce referrals' },
    { label: 'Employer Pipeline', detail: 'Logistics partners' },
    { label: 'Funding Guidance', detail: 'WIOA & WRG support' },
  ],
  whoHeading: 'Who CDL Training Is For',
  whoItems: [
    {
      heading: 'Career Switchers',
      description: 'Adults seeking higher-wage transportation careers with national demand.',
    },
    {
      heading: 'Workforce Referrals',
      description: 'WorkOne participants authorized for transportation sector training.',
    },
    {
      heading: 'Veterans & Reentry',
      description: 'Participants using workforce or reentry funding for commercial driving credentials.',
    },
  ],
  funding: {
    heading: 'Funding CDL Training',
    paragraphs: [
      'Transportation and logistics roles are frequently listed among Indiana in-demand occupations, which may support WIOA funding when WorkOne approves the training plan.',
    ],
    bullets: ['WIOA ITA', 'Workforce Ready Grant', 'Employer-sponsored training', 'Self-pay options'],
    eligibilityNote: 'CDL licensing is issued by the Indiana BMV after meeting state requirements.',
  },
  pathwaysHeading: 'Related Pathways',
  pathways: [
    { name: 'Diesel Mechanic', description: 'Maintain commercial fleets.', href: '/programs/diesel-mechanic' },
    { name: 'All Skilled Trades', description: 'Browse trades programs.', href: '/programs/skilled-trades' },
  ],
  faqs: [
    {
      question: 'Who issues the CDL?',
      answer:
        'Commercial driver licenses are issued by the Indiana Bureau of Motor Vehicles after passing required knowledge and skills tests.',
    },
    {
      question: 'Does Elevate guarantee a driving job?',
      answer:
        'No. We provide training and career services support; hiring decisions are made by employers based on record, performance, and market conditions.',
    },
  ],
  relatedLinks: [
    { label: 'CDL Program', href: '/programs/cdl-training' },
    { label: 'Workforce Hub', href: '/workforce-training-indianapolis' },
    { label: 'Funding', href: '/funding' },
    { label: 'Apply', href: '/apply?program=cdl-training' },
  ],
  complianceNotes: [
    'CDL credentials are issued by the State of Indiana, not by the training provider.',
    'Background checks and driving record requirements apply to commercial driving employment.',
  ],
  ctaHeading: 'Start CDL Training in Indianapolis',
  ctaSubtitle: 'Apply today to discuss eligibility, scheduling, and funding.',
  ctaPrimary: { label: 'Apply Now', href: '/apply?program=cdl-training' },
  ctaSecondary: { label: 'CDL Program', href: '/programs/cdl-training' },
};

export const BARBER_APPRENTICESHIP_INDIANAPOLIS: IndianapolisProgramHubConfig = {
  slug: 'barber-apprenticeship-indianapolis',
  metadata: {
    title: 'Barber Apprenticeship Indianapolis | DOL Registered Program',
    description:
      'DOL-registered barber apprenticeship in Indianapolis. Earn while you learn, Prestige Elevation RTI, and Indiana board-aligned licensure pathway.',
  },
  breadcrumbLabel: 'Barber Apprenticeship Indianapolis',
  programStructuredData: {
    name: 'Barber Apprenticeship Indianapolis',
    description: 'DOL-registered barber apprenticeship with related technical instruction in Indianapolis.',
    category: 'Apprenticeship',
  },
  hero: {
    tag: 'Barber · Apprenticeship · Indianapolis',
    heading: 'Barber Apprenticeship in Indianapolis',
    subtitle: `${org} sponsors DOL-registered barber apprenticeships combining paid shop hours with structured related technical instruction. Licensed by the Indiana State Board of Cosmetology and Barber Examiners pathway.`,
    primaryCta: { label: 'Apply for Apprenticeship', href: '/programs/barber-apprenticeship/apply' },
    secondaryCta: { label: 'Program Overview', href: '/programs/barber-apprenticeship' },
  },
  trustBadges: [
    { label: 'DOL Registered Sponsor', detail: 'RAPIDS-tracked apprenticeship' },
    { label: 'Earn While You Learn', detail: 'Paid on-the-job training' },
    { label: 'RTI Included', detail: 'Structured theory & exams' },
    { label: 'Shop Placement Support', detail: 'Host shop network' },
  ],
  whoHeading: 'Who the Barber Apprenticeship Is For',
  whoItems: [
    {
      heading: 'Aspiring Barbers',
      description: 'Adults seeking licensure through apprenticeship rather than a standalone cosmetology school.',
    },
    {
      heading: 'Career Rebuilders',
      description: 'Participants rebuilding careers through workforce, reentry, or self-pay pathways.',
    },
    {
      heading: 'Shop Owners',
      description: 'Licensed shops interested in sponsoring apprentices under a registered program.',
    },
  ],
  funding: {
    heading: 'Apprenticeship Funding & Costs',
    paragraphs: [
      'Apprentices earn wages from the host shop during on-the-job training. Related technical instruction fees may be covered through workforce funding, scholarships, or self-pay depending on eligibility.',
    ],
    bullets: [
      'Paid OJT from day one at the shop',
      'WIOA may support RTI for eligible participants',
      'Payment plans for self-pay learners',
    ],
    eligibilityNote: 'Barber licenses are issued by the Indiana State Board of Cosmetology and Barber Examiners.',
  },
  pathwaysHeading: 'Beauty & Apprenticeship Pathways',
  pathways: [
    { name: 'Cosmetology', description: 'Related beauty industry training.', href: '/programs/cosmetology' },
    { name: 'All Apprenticeships', description: 'DOL-registered programs.', href: '/programs/apprenticeships' },
  ],
  faqs: [
    {
      question: 'Is this a DOL-registered apprenticeship?',
      answer: `Yes. ${org} holds federal apprenticeship registration and tracks apprentices in RAPIDS.`,
    },
    {
      question: 'Who issues the barber license?',
      answer: 'Indiana barber licenses are issued by the state board after meeting apprenticeship and examination requirements.',
    },
  ],
  relatedLinks: [
    { label: 'Barber Program', href: '/programs/barber-apprenticeship' },
    { label: 'Apprenticeships', href: '/programs/apprenticeships' },
    { label: 'Workforce Hub', href: '/workforce-training-indianapolis' },
    { label: 'Apply', href: '/programs/barber-apprenticeship/apply' },
  ],
  complianceNotes: [
    'Barber licenses are issued by the State of Indiana, not by the training provider.',
    'Apprentices must complete required OJT and RTI hours under board rules.',
  ],
  ctaHeading: 'Start a Barber Apprenticeship in Indianapolis',
  ctaSubtitle: 'Apply to join the next apprenticeship cohort or contact us about host shop partnerships.',
  ctaPrimary: { label: 'Apply Now', href: '/programs/barber-apprenticeship/apply' },
  ctaSecondary: { label: 'Program Details', href: '/programs/barber-apprenticeship' },
};

export const INDIANAPOLIS_PROGRAM_HUBS = [
  CNA_TRAINING_INDIANAPOLIS,
  HVAC_TRAINING_INDIANAPOLIS,
  CDL_TRAINING_INDIANAPOLIS,
  BARBER_APPRENTICESHIP_INDIANAPOLIS,
] as const;
