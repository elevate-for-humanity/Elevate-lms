import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, ProgramStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/healthcare-training-indianapolis';

export const metadata: Metadata = {
  title: 'Healthcare Training Indianapolis | CNA, HHA & Medical Assistant',
  description:
    'CNA, HHA, Medical Assistant, and Patient Care Technician training in Indianapolis. Program requirements vary by pathway. Workforce funding may be available for eligible participants and eligible programs.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Healthcare Training Indianapolis | CNA, HHA & Medical Assistant',
    description:
      'CNA, HHA, Medical Assistant, Phlebotomy, and Patient Care Tech training in Indianapolis. Review each program for current requirements and funding options.',
    url: CANONICAL,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Healthcare Training Indianapolis' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Healthcare Training Indianapolis | Elevate for Humanity',
    description: 'CNA, HHA, Medical Assistant, and Patient Care Technician training in Indianapolis.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: 'What healthcare programs does Elevate for Humanity offer?',
    answer:
      'We offer training programs in Certified Nursing Assistant (CNA), Home Health Aide (HHA), Medical Assisting, Patient Care Technology, and related healthcare support roles. Program availability may vary — see our Programs page for the current catalog.',
  },
  {
    question: 'Are your healthcare programs approved by the state of Indiana?',
    answer:
      'Approval and oversight are program-specific. Our CNA pathway follows the applicable Indiana nurse-aide training requirements reflected in its controlling program record. Final certification and registry decisions are made by the responsible state or credentialing authority, not by Elevate for Humanity.',
  },
  {
    question: 'Does the program include clinical or on-the-job training?',
    answer:
      'Healthcare programs include hands-on clinical or lab components where required by the applicable program standard. Review the individual program record for the exact clinical, lab, or work-based-learning requirement.',
  },
  {
    question: 'Can WIOA pay for healthcare training?',
    answer:
      'WIOA may fund an eligible participant in an eligible program when the responsible workforce agency approves the training and issues the required authorization. Contact WorkOne for the controlling eligibility and funding decision.',
  },
  {
    question: 'What does "third-party credentialing" mean?',
    answer:
      'Credentials such as CNA or Medical Assistant certifications are issued by independent certifying bodies or state agencies — not by Elevate for Humanity. Training may prepare a participant for an examination; the responsible authority determines eligibility, pass/fail status, and credential issuance.',
  },
  {
    question: 'Do you help place graduates with healthcare employers?',
    answer:
      'We provide employer-connection and placement-support workflows. Employment is not guaranteed and depends on the participant, credential requirements, employer selection, and labor-market conditions.',
  },
];

export default function HealthcareTrainingIndianapolisPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/programs' },
          { name: 'Healthcare Training Indianapolis', url: '/healthcare-training-indianapolis' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />
      <ProgramStructuredData
        name="Healthcare Training Programs"
        description="CNA, HHA, Medical Assistant, Phlebotomy, and Patient Care Technician training in Indianapolis. Review each program for its controlling requirements and current funding options."
        url="/healthcare-training-indianapolis"
        category="Healthcare"
      />

      <SeoAuthorityHubPage
        hero={{
          tag: 'CNA · HHA · Medical Assistant · Indianapolis',
          heading: 'Healthcare Career Training in Indianapolis',
          subtitle:
            'Explore CNA, HHA, Medical Assistant, and Patient Care Technician pathways in Indianapolis. Requirements, credential authorities, clinical components, and funding eligibility are disclosed at the individual program level.',
          primaryCta: { label: 'Apply Now', href: '/apply' },
          secondaryCta: { label: 'View Programs', href: '/programs/healthcare' },
        }}
        trustBadges={[
          { label: 'Program Requirements', detail: 'Review the Controlling Program Record' },
          { label: 'Program-Specific Funding', detail: 'Verify Current Listing With WorkOne' },
          { label: 'Agency Authorization Required', detail: 'Participant Eligibility Is Determined Externally' },
          { label: 'Employer Connection Support', detail: 'No Employment Guarantee' },
        ]}
        whoHeading="Who Healthcare Training Is For"
        whoItems={[
          {
            heading: 'Adults Entering Healthcare',
            description:
              'Adults seeking an occupational training pathway into healthcare support roles. Admission and credential requirements vary by program.',
          },
          {
            heading: 'CNA Candidates',
            description:
              'Individuals seeking nurse-aide training who will complete the applicable training, testing, and registry process required by the responsible authority.',
          },
          {
            heading: 'Home Health Aide Candidates',
            description:
              'Adults seeking training for in-home healthcare support roles. Review the current HHA program record for applicable training and registry requirements.',
          },
          {
            heading: 'Medical Office & Clinical Support',
            description:
              'Individuals interested in Medical Assisting, phlebotomy, patient care, or related clinical-support roles in physician offices, clinics, and hospitals.',
          },
          {
            heading: 'WIOA & Agency Referrals',
            description:
              'Participants referred by WorkOne or other workforce agencies. Enrollment and funding coordination follows the participant and program authorization issued by the responsible agency.',
          },
          {
            heading: 'Career Changers',
            description:
              'Individuals moving from another industry who want to evaluate healthcare training pathways and their current admission and credential requirements.',
          },
        ]}
        funding={{
          heading: 'Funding for Healthcare Training',
          paragraphs: [
            'Some healthcare programs may have current ETPL, Workforce Ready Grant, WIOA, or other workforce-funding eligibility. Listing and funding status are program-specific and can change.',
            'Your WorkOne advisor or other responsible agency must confirm participant eligibility, program eligibility, available funds, covered costs, and written authorization before training begins.',
          ],
          bullets: [
            'WIOA Individual Training Account (ITA) — subject to agency and participant eligibility',
            'Workforce Ready Grant — subject to current program and DWD eligibility',
            'Other workforce-agency referrals — subject to the applicable agency authorization',
            'Employer-supported training — where separately approved by the employer or agency',
            'Self-pay and current payment-plan options shown through the applicable enrollment path',
          ],
          eligibilityNote:
            'Funding eligibility is determined by your local WorkOne office or other responsible agency — not by Elevate for Humanity. Do not begin training in reliance on workforce funding until written authorization is issued.',
        }}
        pathwaysHeading="Healthcare Training Pathways"
        pathways={[
          {
            name: 'Certified Nursing Assistant (CNA)',
            description:
              'Nurse-aide training with requirements disclosed in the current program record. The responsible Indiana authority controls competency evaluation and registry decisions.',
            href: '/programs/cna',
          },
          {
            name: 'Home Health Aide (HHA)',
            description:
              'Training for direct-care roles in home health settings. Review the current program record for required training, testing, and registry steps.',
            href: '/programs/cna',
          },
          {
            name: 'Medical Assistant / Patient Care Technician',
            description:
              'Clinical and administrative training for medical office and hospital support roles. Components vary by the selected program and credential pathway.',
            href: '/programs/healthcare',
          },
          {
            name: 'All Healthcare Programs',
            description:
              'See the current catalog of healthcare training programs at Elevate for Humanity.',
            href: '/programs/healthcare',
          },
        ]}
        employer={{
          heading: 'Healthcare Employer Connections',
          paragraphs: [
            'Employer-partnership workflows can connect trained participants with healthcare employers and work-based-learning opportunities where an employer elects to participate.',
            'Employers can also discuss OJT or apprenticeship pathways where the applicable program and agency requirements are met.',
          ],
          bullets: [
            'Candidate referral and employer-connection workflows',
            'Healthcare training pipelines based on current program availability',
            'OJT coordination where separately authorized by the responsible workforce agency',
            'Registered-apprenticeship coordination where an approved occupation and employer structure apply',
            'Incumbent-worker training discussions based on employer requirements',
          ],
          cta: { label: 'Employer Partnership Inquiry', href: '/employer' },
        }}
        faqs={faqs}
        relatedLinks={[
          { label: 'Main Training Hub', href: '/programs' },
          { label: 'WIOA & Funded Training', href: '/wioa-eligibility' },
          { label: 'Employer Partnerships', href: '/employer' },
          { label: 'CNA Program', href: '/programs/cna' },
          { label: 'Healthcare Programs', href: '/programs/healthcare' },
          { label: 'Apply Now', href: '/apply' },
          { label: 'Contact Us', href: '/contact' },
        ]}
        complianceNotes={[
          'Healthcare certifications are issued by the applicable state agency or third-party credentialing body, not by Elevate for Humanity. The responsible authority controls eligibility, examination, and credential issuance.',
          'Healthcare program requirements are program-specific. Review the controlling program record and responsible authority requirements before enrollment.',
          'Elevate for Humanity is a workforce training provider. We do not grant degrees and do not represent institutional academic accreditation unless separately documented.',
          'Funding eligibility under WIOA, Workforce Ready Grant, or any other program is determined by the applicable workforce agency, not by Elevate for Humanity.',
          'Employment outcomes are not guaranteed. Results depend on individual performance, credential attainment, employer selection, and market conditions. Content reviewed 2026.',
        ]}
        ctaHeading="Explore Healthcare Training in Indianapolis"
        ctaSubtitle="Review the current healthcare programs, credential pathways, and funding process before you apply."
        ctaPrimary={{ label: 'Apply Now', href: '/apply' }}
        ctaSecondary={{ label: 'View Healthcare Programs', href: '/programs/healthcare' }}
      />
    </>
  );
}
