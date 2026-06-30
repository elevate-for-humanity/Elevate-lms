import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, ProgramStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/it-certification-training-indianapolis';

export const metadata: Metadata = {
  title: 'IT Certification Training Indianapolis | CompTIA, Cybersecurity & Digital Skills',
  description:
    'CompTIA, Microsoft, cybersecurity, and digital skills training in Indianapolis. Industry-recognized certifications. WIOA funding may be available for eligible Indiana residents.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'IT Certification Training Indianapolis | CompTIA & Cybersecurity',
    description:
      'CompTIA, Microsoft, cybersecurity, and digital literacy training in Indianapolis. Industry certifications. WIOA funding may be available for qualifying residents.',
    url: CANONICAL,
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'IT Certification Training Indianapolis' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IT Certification Training Indianapolis',
    description: 'CompTIA, Microsoft, cybersecurity, and digital skills training in Indianapolis.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: `What IT programs does ${PLATFORM_DEFAULTS.orgName} offer?`,
    answer:
      'We offer training in IT Help Desk / IT Support, Cybersecurity Analyst fundamentals, and digital literacy. Programs are designed to prepare participants for industry certifications from CompTIA and Microsoft. See our Programs page for the current catalog.',
  },
  {
    question: 'Who issues CompTIA and Microsoft certifications?',
    answer:
      `CompTIA certifications (A+, Network+, Security+, etc.) are issued by CompTIA. Microsoft certifications are issued by Microsoft. These are independent third-party credentialing bodies. ${PLATFORM_DEFAULTS.orgName} prepares participants for the exams; the certifying organization issues the credential based on exam performance.`,
  },
  {
    question: 'Can WIOA pay for IT certification training?',
    answer:
      `IT certifications are typically listed among Indiana's high-demand occupations, which may make them eligible for WIOA funding. Eligibility is determined by your local WorkOne office, not by ${PLATFORM_DEFAULTS.orgName}. Contact WorkOne to begin the eligibility process.`,
  },
  {
    question: 'Is IT training available online or in-person?',
    answer:
      'We offer blended learning formats that combine online coursework with instructor-led instruction. Format details vary by program. Contact our admissions team for current delivery options.',
  },
  {
    question: 'What entry-level IT jobs can I get after training?',
    answer:
      'Graduates of our IT Help Desk program are prepared for roles such as IT support specialist, help desk technician, desktop support, and tier-1 technical support. Cybersecurity training prepares participants for entry-level security analyst and security operations roles. Employment outcomes are not guaranteed.',
  },
  {
    question: `Do employers hire from ${PLATFORM_DEFAULTS.orgName} IT programs?`,
    answer:
      'We work with Indianapolis technology employers to connect trained candidates with job opportunities. Employer placement support is available, though employment outcomes depend on individual performance, credential attainment, and local market conditions.',
  },
];

export default function ItCertificationTrainingIndianapolisPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
          { name: 'IT Certification Training Indianapolis', url: '/it-certification-training-indianapolis' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />
      <ProgramStructuredData
        name="IT Certification Training Programs"
        description="CompTIA, Microsoft, cybersecurity, and digital skills training in Indianapolis. Industry-recognized certifications."
        url="/it-certification-training-indianapolis"
        category="Information Technology"
      />

      <SeoAuthorityHubPage
        hero={{
          tag: 'CompTIA · Microsoft · Cybersecurity · Indianapolis',
          heading: 'IT Certification Training in Indianapolis',
          subtitle:
            `Launch your technology career with industry-recognized certifications. ${PLATFORM_DEFAULTS.orgName} prepares Indianapolis and Indiana residents for CompTIA, Microsoft, and cybersecurity credentials. WIOA funding may be available for eligible participants.`,
          primaryCta: { label: 'Apply Now', href: '/apply' },
          secondaryCta: { label: 'View IT Programs', href: '/programs/it-help-desk' },
        }}
        trustBadges={[
          { label: 'CompTIA Exam Prep', detail: 'A+, Network+, Security+' },
          { label: 'Microsoft Certification Prep', detail: 'Industry-Recognized' },
          { label: 'ETPL Approved', detail: 'Indiana Training Provider List' },
          { label: 'WIOA Eligible', detail: 'WorkOne Referrals Accepted' },
        ]}
        whoHeading="Who IT Training Is For"
        whoItems={[
          {
            heading: 'Career Changers Entering Technology',
            description:
              'Adults with no prior IT experience who want to enter the technology field through a structured, credential-focused training program.',
          },
          {
            heading: 'IT Help Desk & Support Candidates',
            description:
              'Individuals seeking entry-level IT support roles. CompTIA A+ is the industry standard entry-level credential for technical support positions.',
          },
          {
            heading: 'Cybersecurity Candidates',
            description:
              'Adults interested in security analyst, SOC analyst, or cybersecurity support roles. Security+ is a widely recognized entry credential for this path.',
          },
          {
            heading: 'Digital Literacy Learners',
            description:
              'Adults who need foundational digital skills for workplace computer use, Microsoft Office, and basic technology competency.',
          },
          {
            heading: 'WIOA & Workforce Referrals',
            description:
              'Participants referred through WorkOne, FSSA IMPACT, or other workforce agencies for IT training funded through WIOA Individual Training Accounts.',
          },
          {
            heading: 'Upskilling Workers',
            description:
              'Employed individuals seeking additional certifications to advance in technology roles or move from non-technical to technical positions.',
          },
        ]}
        funding={{
          heading: 'Funding for IT Training',
          paragraphs: [
            'Technology occupations are consistently listed among Indiana\'s high-demand industries, which may increase eligibility for WIOA and Workforce Ready Grant funding.',
            `As an ETPL-approved training provider, ${PLATFORM_DEFAULTS.orgName} can accept WIOA Individual Training Account referrals for eligible IT programs. Contact WorkOne or our admissions team to begin.`,
          ],
          bullets: [
            'WIOA Individual Training Account (ITA) — ETPL-eligible IT programs',
            'Workforce Ready Grant — high-demand credentials (DWD eligibility required)',
            'FSSA IMPACT — qualifying public-assistance recipients',
            'Self-pay and payment plan options available',
            'Employer-sponsored training available for eligible employer partners',
          ],
          eligibilityNote:
            `Funding eligibility is determined by your local WorkOne office or the applicable workforce agency — not by ${PLATFORM_DEFAULTS.orgName}. Contact us or WorkOne to start the eligibility process.`,
        }}
        pathwaysHeading="IT & Digital Skills Pathways"
        pathways={[
          {
            name: 'IT Help Desk / IT Support',
            description:
              'Comprehensive IT support training with CompTIA A+ exam preparation. Prepares participants for entry-level IT support, help desk, and desktop support roles.',
            href: '/programs/it-help-desk',
          },
          {
            name: 'Cybersecurity Analyst',
            description:
              'Foundational cybersecurity training with CompTIA Security+ preparation. Covers network security, threat detection, and security operations concepts.',
            href: '/programs/cybersecurity-analyst',
          },
          {
            name: 'Digital Literacy',
            description:
              'Foundational technology skills for workplace productivity. Microsoft Office, computer basics, and professional digital communication.',
            href: '/programs',
          },
          {
            name: 'All Technology Programs',
            description:
              `Browse the full catalog of IT and technology training programs at ${PLATFORM_DEFAULTS.orgName}.`,
            href: '/programs',
          },
        ]}
        employer={{
          heading: 'IT Employer Placement',
          paragraphs: [
            'We work with Indianapolis technology employers, managed service providers, and corporate IT departments to connect trained, certified candidates with open positions.',
            'Employer partners can access trained candidate pipelines, OJT wage reimbursement for eligible hires, and customized training solutions for incumbent workers.',
          ],
          bullets: [
            'Pre-screened CompTIA and Microsoft certification candidates',
            'IT help desk and cybersecurity pipelines for Indianapolis employers',
            'OJT coordination for eligible employer partners',
            'No recruiting fee for partner employers',
            'Custom training programs for incumbent IT staff',
          ],
          cta: { label: 'Become an Employer Partner', href: '/employer-workforce-partnerships-indiana' },
        }}
        faqs={faqs}
        relatedLinks={[
          { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
          { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
          { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
          { label: 'IT Help Desk Program', href: '/programs/it-help-desk' },
          { label: 'Cybersecurity Program', href: '/programs/cybersecurity-analyst' },
          { label: 'All Programs', href: '/programs' },
          { label: 'Apply Now', href: '/apply' },
        ]}
        complianceNotes={[
          `IT certifications (CompTIA A+, Network+, Security+, Microsoft certifications) are issued by independent third-party credentialing organizations, not by ${PLATFORM_DEFAULTS.orgName}. Passing the applicable certification examination is required to earn the credential.`,
          `${PLATFORM_DEFAULTS.orgName} is a workforce training provider. We do not grant degrees and do not hold regional academic accreditation.`,
          `Funding eligibility under WIOA or any other program is determined by the applicable workforce agency, not by ${PLATFORM_DEFAULTS.orgName}.`,
          'Employment outcomes are not guaranteed. Results depend on individual performance, credential attainment, and local market conditions.',
          'Content reviewed 2026. Program availability subject to change.',
        ]}
        ctaHeading="Launch Your IT Career in Indianapolis"
        ctaSubtitle="Apply today or contact us to find the right IT certification program and funding options for you."
        ctaPrimary={{ label: 'Apply Now', href: '/apply' }}
        ctaSecondary={{ label: 'View IT Programs', href: '/programs/it-help-desk' }}
      />
    </>
  );
}
