import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, ProgramStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/skilled-trades-training-indiana';

export const metadata: Metadata = {
  title: 'Skilled Trades Training Indiana | HVAC, Electrical & Apprenticeships | Elevate for Humanity',
  description:
    'HVAC, electrical, construction, OSHA, and EPA 608 training in Indiana. DOL-registered apprenticeship sponsor. Employer OJT and work-based learning pathway available.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Skilled Trades Training Indiana | HVAC, Electrical & Apprenticeships',
    description:
      'HVAC, electrical, construction, OSHA, and EPA 608 training in Indiana. DOL-registered apprenticeship sponsor. OJT and work-based learning available.',
    url: CANONICAL,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Skilled Trades Training Indiana' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skilled Trades Training Indiana | Elevate for Humanity',
    description: 'HVAC, electrical, construction, OSHA, and EPA 608 training in Indiana. DOL-registered apprenticeship sponsor.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: 'What skilled trades programs does Elevate for Humanity offer?',
    answer:
      'We offer training in HVAC (including EPA 608 refrigerant handling certification), electrical systems, construction fundamentals, and OSHA safety certifications. Program availability may vary — see our Programs page for the current catalog.',
  },
  {
    question: 'What is EPA 608 and why does it matter for HVAC?',
    answer:
      'EPA Section 608 certification is federally required for technicians who purchase or handle regulated refrigerants. HVAC technicians must be EPA 608 certified to legally service refrigeration and air conditioning equipment containing regulated refrigerants.',
  },
  {
    question: 'Is Elevate for Humanity a DOL-registered apprenticeship sponsor?',
    answer:
      'Yes. Elevate for Humanity holds DOL-registered apprenticeship sponsorship. Registered apprenticeships combine paid on-the-job training with structured related technical instruction and lead to industry-recognized credentials.',
  },
  {
    question: 'What is OJT (on-the-job training) and how does it work?',
    answer:
      'On-the-job training (OJT) is a work-based learning model where an employer hires and trains a new worker on the job. Eligible employers may receive wage reimbursement for the time spent training the new hire. Eligibility and reimbursement rates are determined by the applicable workforce program.',
  },
  {
    question: 'Can WIOA fund skilled trades training?',
    answer:
      'WIOA Individual Training Accounts can be used at ETPL-approved programs, which may include skilled trades programs at Elevate for Humanity. WIOA eligibility is determined by your local WorkOne office. Contact WorkOne or our admissions team to begin the process.',
  },
  {
    question: 'What credentials will I earn?',
    answer:
      'Credentials vary by program and are issued by independent third-party certifying organizations, not by Elevate for Humanity. For example, EPA 608 certification is issued by an EPA-recognized certifying organization. OSHA cards are issued by OSHA Training Institute Education Centers. We prepare you for the relevant examination.',
  },
];

export default function SkilledTradesTrainingIndianaPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
          { name: 'Skilled Trades Training Indiana', url: '/skilled-trades-training-indiana' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />
      <ProgramStructuredData
        name="Skilled Trades Training Programs"
        description="HVAC, electrical, construction, OSHA, and EPA 608 training in Indiana. DOL-registered apprenticeship sponsor."
        url="/skilled-trades-training-indiana"
        category="Skilled Trades"
      />

      <SeoAuthorityHubPage
        hero={{
          tag: 'HVAC · Electrical · Construction · Apprenticeships · Indiana',
          heading: 'Skilled Trades Training & Apprenticeships in Indiana',
          subtitle:
            'Build a career in the trades. Elevate for Humanity is a DOL-registered apprenticeship sponsor and Indiana ETPL-approved training provider for HVAC, electrical, construction, OSHA safety, and EPA 608 certification. WIOA funding may be available.',
          primaryCta: { label: 'Apply Now', href: '/apply' },
          secondaryCta: { label: 'View Programs', href: '/programs/hvac-technician' },
        }}
        trustBadges={[
          { label: 'DOL Registered', detail: 'Apprenticeship Sponsor' },
          { label: 'EPA 608 Prep', detail: 'Refrigerant Handling Certification' },
          { label: 'ETPL Approved', detail: 'Indiana Training Provider List' },
          { label: 'WIOA Compliant', detail: 'WorkOne Referrals Accepted' },
        ]}
        whoHeading="Who Skilled Trades Training Is For"
        whoItems={[
          {
            heading: 'HVAC Technician Candidates',
            description:
              'Adults seeking careers in heating, ventilation, and air conditioning. EPA 608 certification required for refrigerant handling — we prepare you for the exam.',
          },
          {
            heading: 'Electrical & Construction Workers',
            description:
              'Individuals pursuing electrical systems or construction careers. Entry-level and foundational programs available with employer pathway partnerships.',
          },
          {
            heading: 'Apprenticeship Candidates',
            description:
              'Individuals interested in DOL-registered apprenticeships that combine paid employment with structured technical training and lead to journeyperson credentials.',
          },
          {
            heading: 'OSHA Safety Certification Seekers',
            description:
              'Workers and employers who need OSHA 10 or OSHA 30 construction and general industry certifications for job site compliance.',
          },
          {
            heading: 'WIOA & Workforce Referrals',
            description:
              'WorkOne-referred adults and dislocated workers seeking skilled trades training funded through WIOA Individual Training Accounts.',
          },
          {
            heading: 'Incumbent Workers Upskilling',
            description:
              'Employed tradespeople seeking additional certifications — EPA 608, OSHA, or supplemental electrical — to increase earning potential.',
          },
        ]}
        funding={{
          heading: 'Funding for Skilled Trades Training',
          paragraphs: [
            'Skilled trades are consistently designated as high-demand occupations in Indiana, which makes them strong candidates for WIOA and other workforce funding. As an ETPL-approved provider, Elevate for Humanity is authorized to receive referrals from WorkOne offices.',
            'Apprenticeship participants may also benefit from earn-as-you-learn models where the employer pays wages during the training period, reducing or eliminating out-of-pocket training costs.',
          ],
          bullets: [
            'WIOA Individual Training Account (ITA) — ETPL-eligible programs',
            'Workforce Ready Grant — high-demand credential programs (DWD eligibility required)',
            'OJT wage reimbursement — employer-sponsored (eligible employers)',
            'Registered apprenticeship — paid work + training model',
            'FSSA IMPACT — qualifying public-assistance recipients',
            'Self-pay and payment plan options available',
          ],
          eligibilityNote:
            'Funding eligibility is determined by your local WorkOne office or the applicable workforce agency — not by Elevate for Humanity. Contact us or WorkOne to start the process.',
        }}
        pathwaysHeading="Skilled Trades Training Pathways"
        pathways={[
          {
            name: 'HVAC Technician',
            description:
              'Comprehensive HVAC training covering heating, cooling, refrigeration, and ventilation systems. Includes EPA 608 refrigerant handling certification prep.',
            href: '/programs/hvac-technician',
          },
          {
            name: 'EPA 608 Certification',
            description:
              'Federally required certification for technicians who purchase or handle regulated refrigerants. Certification issued by EPA-recognized organization.',
            href: '/programs/hvac-technician',
          },
          {
            name: 'OSHA Safety Certifications',
            description:
              'OSHA 10 and OSHA 30 construction and general industry training. OSHA outreach cards issued through OSHA-authorized education centers.',
            href: '/programs',
          },
          {
            name: 'Registered Apprenticeships',
            description:
              'DOL-registered apprenticeship programs combining paid on-the-job training with technical instruction. Industry-recognized journeyperson credentials.',
            href: '/apprenticeships',
          },
        ]}
        employer={{
          heading: 'Employer & OJT Pathway',
          paragraphs: [
            'Indiana construction, HVAC, and electrical employers can partner with Elevate for Humanity to build trained workforce pipelines and establish registered apprenticeship programs.',
            'Eligible employer partners may access OJT wage reimbursement through WIOA, reducing the cost of training new hires in skilled trades roles.',
          ],
          bullets: [
            'Pre-trained HVAC and trades candidates',
            'OJT wage reimbursement for eligible employer partners',
            'DOL-registered apprenticeship program development support',
            'OSHA training and safety compliance programs for job sites',
            'No recruiting fee for employer partners',
          ],
          cta: { label: 'Become an Employer Partner', href: '/employer-workforce-partnerships-indiana' },
        }}
        faqs={faqs}
        relatedLinks={[
          { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
          { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
          { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
          { label: 'HVAC Technician Program', href: '/programs/hvac-technician' },
          { label: 'Apprenticeships', href: '/apprenticeships' },
          { label: 'All Programs', href: '/programs' },
          { label: 'Apply Now', href: '/apply' },
        ]}
        complianceNotes={[
          'Credentials and certifications (EPA 608, OSHA, electrical) are issued by independent third-party certifying bodies or regulatory authorities, not by Elevate for Humanity. Passing the applicable examination is required to earn the credential.',
          'EPA Section 608 certification is required by federal regulation for technicians who purchase or handle regulated refrigerants. Regulatory requirements are set by the U.S. Environmental Protection Agency.',
          'OSHA training cards are issued through OSHA-authorized training programs. Elevate for Humanity is a workforce training provider, not an OSHA-authorized Education Center. Verify current authorization status on the OSHA website.',
          'Elevate for Humanity is a workforce training provider. We do not grant degrees and do not hold regional academic accreditation.',
          'Funding eligibility under WIOA or any other program is determined by the applicable workforce agency, not by Elevate for Humanity. OJT reimbursement eligibility is determined by the applicable program administrator.',
          'Employment outcomes are not guaranteed. Content reviewed 2026.',
        ]}
        ctaHeading="Build a Trades Career in Indiana"
        ctaSubtitle="Apply today or contact us to find the right skilled trades program and funding path."
        ctaPrimary={{ label: 'Apply Now', href: '/apply' }}
        ctaSecondary={{ label: 'View Apprenticeships', href: '/apprenticeships' }}
      />
    </>
  );
}
