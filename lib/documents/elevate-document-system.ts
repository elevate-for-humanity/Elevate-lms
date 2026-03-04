/**
 * Elevate Master Document System
 *
 * Standard document architecture for all institutional documents,
 * MOUs, emails, reports, and partner communications.
 *
 * Every document produced by Elevate follows the same structural
 * DNA so workforce boards, credential partners, and state agencies
 * see a consistent institutional identity.
 */

// ─── Organization Identity ───────────────────────────────────────

export const ORG = {
  name: 'Elevate for Humanity',
  operator: '2Exclusive LLC-S',
  website: 'https://www.elevateforhumanity.org',
  email: 'info@elevateforhumanity.org',
  phone: '(317) 555-0100',
  address: 'Indianapolis, IN',
  logoUrl: '/images/logo.png',
  // Absolute URL for emails (images must be absolute in email HTML)
  logoAbsoluteUrl: 'https://www.elevateforhumanity.org/images/logo.png',
  tagline: 'Workforce Development & Career Training',
} as const;

// ─── Document Section Types ──────────────────────────────────────

export interface DocumentSection {
  heading: string;
  content: string | string[];
  /** Optional subsections for complex breakdowns */
  subsections?: { heading: string; content: string | string[] }[];
}

export interface ElevateDocument {
  title: string;
  subtitle?: string;
  /** e.g. 'Program Description', 'Memorandum of Understanding', 'Grant Narrative' */
  documentType: string;
  /** ISO date string */
  date: string;
  /** Optional version for tracked documents */
  version?: string;
  /** Optional reference number */
  referenceNumber?: string;
  sections: DocumentSection[];
}

// ─── Master Section Order ────────────────────────────────────────
// Documents should follow this order unless a regulatory format is required.

export const MASTER_SECTION_ORDER = [
  'Overview',
  'Background',
  'Program or Policy Description',
  'Structure or Components',
  'Credentials or Outcomes',
  'Operational Model',
  'Partnerships',
  'Compliance and Alignment',
  'Implementation',
  'Summary',
] as const;

// ─── Formatting Rules ────────────────────────────────────────────

export const FORMATTING_RULES = {
  maxParagraphLines: 6,
  headingEveryNParagraphs: 4,
  maxListItems: 5, // beyond 5, use a subsection
  bannedFillerWords: ['things', 'various', 'stuff', 'etc.', 'really', 'very', 'basically'],
  tone: 'Professional, direct, single-spaced. No marketing language in compliance sections.',
} as const;

// ─── Prompt Library ──────────────────────────────────────────────

export const PROMPTS = {
  reformatDocument: `Reformat the following content into a professional workforce training document suitable for review by state agencies, workforce boards, or institutional partners. Maintain all information but improve clarity, structure, and readability.

Requirements:
Single spaced.
Professional tone but natural human language.
Clear section headings.
Logical ordering of sections.
No unnecessary repetition.
Break long paragraphs into readable sections.
Preserve all technical or regulatory details.

Use the following structure:

Title
Overview
Background
Program or Policy Description
Structure or Components
Credentials or Outcomes
Operational Model
Partnerships
Compliance and Alignment
Implementation
Summary.`,

  reformatEmail: `Reformat the following into a professional institutional email from Elevate for Humanity. Keep the tone professional but approachable. Include clear subject line, greeting, body with short paragraphs, and a professional signature block.`,

  reformatMOU: `Reformat the following into a formal Memorandum of Understanding between Elevate for Humanity and the named partner. Use numbered sections, clear definitions, and standard legal formatting. Maintain all substantive terms.`,
} as const;

// ─── Document Type Templates ─────────────────────────────────────

export type DocumentTemplate =
  | 'program-description'
  | 'mou-partnership'
  | 'workforce-submission'
  | 'credential-alignment'
  | 'grant-narrative'
  | 'institutional-overview'
  | 'student-handbook'
  | 'employer-agreement';

export const DOCUMENT_TEMPLATES: Record<DocumentTemplate, string[]> = {
  'program-description': [
    'Overview',
    'Background',
    'Program Description',
    'Structure and Components',
    'Credentials and Outcomes',
    'Operational Model',
    'Partnerships',
    'Compliance and Alignment',
    'Implementation',
    'Summary',
  ],
  'mou-partnership': [
    'Overview',
    'Purpose',
    'Parties',
    'Scope of Agreement',
    'Roles and Responsibilities',
    'Term and Duration',
    'Compliance and Standards',
    'Modification and Termination',
    'Signatures',
  ],
  'workforce-submission': [
    'Overview',
    'Background and Need',
    'Program Description',
    'Target Population',
    'Credentials and Outcomes',
    'Delivery Model',
    'Employer Partnerships',
    'Compliance and Alignment',
    'Budget and Funding',
    'Implementation Timeline',
    'Summary',
  ],
  'credential-alignment': [
    'Overview',
    'Credential Description',
    'Issuing Authority',
    'Alignment to Standards',
    'Assessment and Validation',
    'Stackable Pathways',
    'Employer Recognition',
    'Summary',
  ],
  'grant-narrative': [
    'Overview',
    'Statement of Need',
    'Program Description',
    'Goals and Objectives',
    'Target Population',
    'Methodology and Approach',
    'Credentials and Outcomes',
    'Partnerships',
    'Sustainability',
    'Evaluation Plan',
    'Budget Justification',
    'Summary',
  ],
  'institutional-overview': [
    'Overview',
    'Mission and Background',
    'Programs Offered',
    'Credentials and Outcomes',
    'Delivery Model',
    'Partnerships and Affiliations',
    'Compliance and Approvals',
    'Summary',
  ],
  'student-handbook': [
    'Overview',
    'Program Description',
    'Enrollment and Admission',
    'Academic Policies',
    'Attendance and Conduct',
    'Credentials and Completion',
    'Support Services',
    'Grievance Procedures',
    'Summary',
  ],
  'employer-agreement': [
    'Overview',
    'Purpose',
    'Parties',
    'Employer Commitments',
    'Training Provider Commitments',
    'Apprentice or Trainee Expectations',
    'Term and Duration',
    'Compliance',
    'Signatures',
  ],
};
