import type { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, ProgramStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/skilled-trades-training-indiana';

export const metadata: Metadata = {
  title: 'Skilled Trades Training Indiana | HVAC & Apprenticeship Pathways',
  description:
    'Skilled trades training pathways in Indiana with documented HVAC funding evidence, apprenticeship administration, employer OJT relationships, and program-specific credential requirements.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Skilled Trades Training Indiana | HVAC & Apprenticeship Pathways',
    description: 'Explore skilled trades pathways with program-specific funding and credential disclosures.',
    url: CANONICAL,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Skilled Trades Training Indiana' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skilled Trades Training Indiana | Elevate for Humanity',
    description: 'Skilled trades pathways with documented program, funding, credential, and apprenticeship records.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: 'What skilled trades programs are available?',
    answer:
      'Program availability changes over time. The current catalog should be used as the source of truth for active HVAC, construction, safety, transportation, and other trade-related offerings.',
  },
  {
    question: 'Is HVAC publicly funded?',
    answer:
      'Elevate maintains current Indiana program-level evidence for its HVAC Technician training pathway. Participant eligibility, available funds, covered costs, and written authorization remain decisions of the responsible workforce agency.',
  },
  {
    question: 'Does every skilled trades program qualify for WIOA or Workforce Ready Grant funding?',
    answer:
      'No. Funding is program-specific. Elevate does not treat an entire category or provider organization as funded merely because one program has an approved or listed pathway.',
  },
  {
    question: 'What is OJT?',
    answer:
      'On-the-job training is a work-based model in which an employer trains a worker while employed. Any wage reimbursement or workforce-program support depends on the governing program, employer eligibility, participant eligibility, and authorization.',
  },
  {
    question: 'Is Elevate a registered apprenticeship sponsor?',
    answer:
      'Elevate maintains U.S. Department of Labor sponsor registration evidence. Individual occupations, host employers, participants, hours, competencies, wages, and completion requirements remain governed by the applicable registered standards.',
  },
  {
    question: 'Who issues occupational credentials?',
    answer:
      'Credential authority depends on the program. Third-party certifications remain under the authority of the applicable certifying or regulatory body; Elevate does not claim authority to issue a third-party credential merely because it prepares a learner for that credential.',
  },
];

export default function SkilledTradesTrainingIndianaPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Programs', url: '/programs' },
          { name: 'Skilled Trades Training Indiana', url: '/skilled-trades-training-indiana' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />
      <ProgramStructuredData
        name="Skilled Trades Training Pathways"
        description="Indiana skilled trades training with program-specific funding, credential, employer, and apprenticeship disclosures."
        url="/skilled-trades-training-indiana"
        category="Skilled Trades"
      />

      <SeoAuthorityHubPage
        hero={{
          tag: 'HVAC · Work-Based Learning · Apprenticeship · Indiana',
          heading: 'Skilled Trades Training & Work-Based Pathways in Indiana',
          subtitle:
            'Explore trade pathways through the current program catalog. Public funding, credential, apprenticeship, and employer statements are tied to the exact program evidence available for that pathway.',
          primaryCta: { label: 'View Programs', href: '/programs' },
          secondaryCta: { label: 'HVAC Technician', href: '/programs/hvac-technician' },
        }}
        trustBadges={[
          { label: 'Program-Specific', detail: 'Funding evidence' },
          { label: 'DOL Sponsor', detail: 'Registration evidence' },
          { label: 'Digital Records', detail: 'Attendance & progress' },
          { label: 'Credential-Aware', detail: 'Issuer separation' },
        ]}
        whoHeading="Who These Pathways Serve"
        whoItems={[
          { heading: 'HVAC Candidates', description: 'Learners pursuing heating, cooling, refrigeration, maintenance, and related credential preparation.' },
          { heading: 'Work-Based Learners', description: 'Participants whose approved pathway combines instruction with documented employer-based learning.' },
          { heading: 'Apprenticeship Candidates', description: 'Individuals entering an applicable registered occupation through the sponsor, host employer, and approved standards.' },
          { heading: 'Employer Partners', description: 'Employers using documented training, OJT, apprenticeship, placement, or worksite relationships.' },
          { heading: 'Workforce Referrals', description: 'Participants referred through workforce programs where the specific training program and participant are eligible and authorized.' },
          { heading: 'Incumbent Workers', description: 'Employed workers seeking additional occupational training or credential preparation based on program availability.' },
        ]}
        funding={{
          heading: 'Program-Specific Funding Review',
          paragraphs: [
            'Elevate maintains current Indiana evidence for the HVAC Technician pathway and a separate documented Workforce Ready Grant approval for CDL training. That evidence does not make every skilled trades program WIOA- or grant-funded.',
            'Before enrollment is represented as publicly funded, the specific program record and the participant authorization must both support that status.',
          ],
          bullets: [
            'HVAC Technician — current Indiana program-level workforce-training evidence',
            'CDL Training — documented Indiana Workforce Ready Grant program-location approval',
            'Other trade programs — no public funding claim unless exact program evidence is verified',
            'OJT reimbursement — only when the applicable employer, participant, and workforce program authorize it',
            'Registered apprenticeship — wages and training requirements follow the applicable standards and employer relationship',
            'Self-pay or other payment arrangements — governed by the current enrollment agreement',
          ],
          eligibilityNote:
            'Funding eligibility and authorization are determined by the responsible workforce agency. Elevate does not guarantee WIOA, Workforce Ready Grant, OJT reimbursement, or any other public funding.',
        }}
        pathwaysHeading="Current Trade Pathways"
        pathways={[
          { name: 'HVAC Technician', description: 'Heating, cooling, refrigeration, safety, diagnostics, installation, maintenance, and applicable credential preparation.', href: '/programs/hvac-technician' },
          { name: 'CDL Training', description: 'Commercial driver training with a documented Indiana Workforce Ready Grant program-location approval.', href: '/programs/cdl' },
          { name: 'Registered Apprenticeships', description: 'Occupation-specific apprenticeship administration using applicable sponsor standards, OJL/RTI records, worksite relationships, and verification controls.', href: '/apprenticeships' },
          { name: 'All Active Programs', description: 'Use the current catalog to confirm whether a trade, safety, construction, or other occupational program is presently active.', href: '/programs' },
        ]}
        employer={{
          heading: 'Employer & Worksite Pathways',
          paragraphs: [
            'Employer relationships are maintained as explicit records. An employer partnership does not automatically create a funding entitlement, registered apprenticeship, credential authority, or reimbursement right.',
            'Where a program uses apprenticeship or OJT workflows, the platform can retain approved worksite, attendance, progress, hour, competency, wage, agreement, and review evidence.',
          ],
          bullets: [
            'Documented employer and worksite relationships',
            'Geofenced timeclock evidence for configured apprenticeship worksites',
            'OJL/RTI and competency records for applicable registered pathways',
            'Placement-related records when the employer workflow is used',
            'Funding and reimbursement statements remain conditional on the governing program',
          ],
          cta: { label: 'Employer Information', href: '/employers' },
        }}
        faqs={faqs}
        relatedLinks={[
          { label: 'All Programs', href: '/programs' },
          { label: 'HVAC Technician', href: '/programs/hvac-technician' },
          { label: 'CDL Training', href: '/programs/cdl' },
          { label: 'Apprenticeships', href: '/apprenticeships' },
          { label: 'Funding', href: '/funding' },
          { label: 'Employers', href: '/employers' },
        ]}
        complianceNotes={[
          'Public funding claims are controlled at the program level and still require participant authorization by the responsible agency.',
          'Third-party occupational certifications remain under the authority of their applicable issuing or regulatory body.',
          'Organization-level registered apprenticeship sponsorship does not automatically make every trade program a registered occupation.',
          'Employment, wage, funding, credential, completion, and reimbursement outcomes are not guaranteed.',
        ]}
        ctaHeading="Review the Exact Trade Pathway"
        ctaSubtitle="Start with the current program record, then verify funding, credential, worksite, and apprenticeship requirements for that exact pathway."
        ctaPrimary={{ label: 'View Programs', href: '/programs' }}
        ctaSecondary={{ label: 'Funding Review', href: '/funding' }}
      />
    </>
  );
}
