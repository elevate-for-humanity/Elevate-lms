import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export type LegalDoc = {
  slug: string;
  title: string;
  summary: string;
};

export const legalDocs: LegalDoc[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'How we collect, use, and protect personal information.',
  },
  {
    slug: 'enrollment-agreement',
    title: 'Enrollment Agreement',
    summary: 'Terms and conditions of enrollment in ' + PLATFORM_DEFAULTS.orgName + ' programs.',
  },
  {
    slug: 'eula',
    title: 'End User License Agreement',
    summary: 'Terms governing use of Elevate software and digital platforms.',
  },
  {
    slug: 'acceptable-use',
    title: 'Acceptable Use Agreement',
    summary: 'Permitted and prohibited uses of Elevate technology resources.',
  },
  {
    slug: 'ferpa-consent',
    title: 'FERPA Consent Form',
    summary: 'Authorization for release of student education records.',
  },
  {
    slug: 'employer-agreement',
    title: 'Employer Agreement',
    summary: 'Terms for employers participating in Elevate workforce programs.',
  },
  {
    slug: 'partner-mou',
    title: 'Partner Memorandum of Understanding',
    summary: 'Terms for organizational partners and training site agreements.',
  },
  {
    slug: 'creator-agreement',
    title: 'Content Creator Agreement',
    summary: 'Terms for instructors and content creators contributing to Elevate programs.',
  },
  {
    slug: 'nda',
    title: 'Non-Disclosure Agreement',
    summary: 'Confidentiality terms for partners and contractors.',
  },
  {
    slug: 'data-sharing',
    title: 'Data Sharing Agreement',
    summary: 'Terms governing the sharing of data with partner organizations.',
  },
  {
    slug: 'student-handbook',
    title: 'Student Handbook',
    summary: 'Comprehensive guide to policies, procedures, and resources for students.',
  },
  {
    slug: 'disclosures',
    title: 'Required Disclosures',
    summary: 'Federal and state required disclosures for educational institutions.',
  },
  {
    slug: 'governance',
    title: 'Governance Documents',
    summary: 'Organizational governance structure and bylaws.',
  },
];
