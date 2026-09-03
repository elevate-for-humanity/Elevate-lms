export type PolicyPage = {
  slug: string;
  title: string;
  summary: string;
};

export const policies: PolicyPage[] = [
  {
    slug: 'admissions',
    title: 'Admissions Policy',
    summary: 'Requirements and process for enrollment in Elevate for Humanity programs.',
  },
  {
    slug: 'attendance',
    title: 'Attendance Policy',
    summary: 'Attendance requirements and procedures for all programs.',
  },
  {
    slug: 'academic-integrity',
    title: 'Academic Integrity Policy',
    summary: 'Standards for academic honesty and consequences for violations.',
  },
  {
    slug: 'acceptable-use',
    title: 'Acceptable Use Policy',
    summary: 'Guidelines for appropriate use of Elevate technology and resources.',
  },
  {
    slug: 'ai-usage',
    title: 'AI Usage Policy',
    summary: 'Guidelines for the use of artificial intelligence tools in coursework.',
  },
  {
    slug: 'privacy-notice',
    title: 'Privacy Notice',
    summary: 'How Elevate for Humanity collects, uses, and protects your personal information.',
  },
  {
    slug: 'ferpa',
    title: 'FERPA Policy',
    summary:
      'Student education records rights under the Family Educational Rights and Privacy Act.',
  },
  {
    slug: 'refund',
    title: 'Refund Policy',
    summary: 'Tuition refund schedule and procedures for program withdrawal.',
  },
  {
    slug: 'progress',
    title: 'Satisfactory Academic Progress',
    summary: 'Standards for maintaining satisfactory academic progress in all programs.',
  },
  {
    slug: 'student-code',
    title: 'Student Code of Conduct',
    summary: 'Behavioral expectations and disciplinary procedures for all students.',
  },
  {
    slug: 'community-guidelines',
    title: 'Community Guidelines',
    summary: 'Standards for respectful participation in Elevate community spaces.',
  },
  {
    slug: 'wioa',
    title: 'WIOA Compliance Policy',
    summary: 'Compliance requirements for WIOA-funded program participants.',
  },
  {
    slug: 'federal-compliance',
    title: 'Federal Compliance',
    summary: 'Federal regulatory compliance information for all programs.',
  },
  {
    slug: 'data-retention',
    title: 'Data Retention Policy',
    summary: 'How long Elevate retains student and organizational records.',
  },
  {
    slug: 'credentials',
    title: 'Credential Verification Policy',
    summary: 'Process for verifying and issuing program credentials and certificates.',
  },
];
