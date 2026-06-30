import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/wioa-funded-training-indiana';

export const metadata: Metadata = {
  title: 'WIOA Funded Training Indiana | Free Job Training Indianapolis',
  description:
    'Understand WIOA funding for career training in Indiana. Workforce Ready Grant, FSSA IMPACT, WorkOne referrals. Eligibility determined by your local workforce agency.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'WIOA Funded Training Indiana',
    description:
      'WIOA-funded career training in Indiana. WorkOne referrals accepted. Workforce Ready Grant and FSSA IMPACT eligible programs. Eligibility determined by your agency.',
    url: CANONICAL,
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'WIOA Funded Training Indiana' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WIOA Funded Training Indiana',
    description: 'WIOA-funded career training in Indiana. WorkOne referrals, Workforce Ready Grant, FSSA IMPACT.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: 'What is WIOA and how does it pay for training?',
    answer:
      `The Workforce Innovation and Opportunity Act (WIOA) is a federal law that funds career training for eligible adults, dislocated workers, and youth. Eligible individuals are issued Individual Training Accounts (ITAs) through their local WorkOne office to pay for approved programs on Indiana's Eligible Training Provider List (ETPL). ${PLATFORM_DEFAULTS.orgName} is ETPL-approved.`,
  },
  {
    question: 'How do I find out if I qualify for WIOA funding?',
    answer:
      `Contact your local WorkOne office or visit workone.in.gov. A career advisor will assess your eligibility based on income, employment status, and other factors. ${PLATFORM_DEFAULTS.orgName} does not determine WIOA eligibility — that is the responsibility of your local workforce agency.`,
  },
  {
    question: 'What is the Workforce Ready Grant?',
    answer:
      'The Workforce Ready Grant is an Indiana state program that funds training for high-demand credentials at approved providers. Eligibility and funding levels are determined by the Indiana Department of Workforce Development (DWD). Visit dwd.in.gov for current program details and eligibility requirements.',
  },
  {
    question: 'What is FSSA IMPACT?',
    answer:
      `FSSA IMPACT is an Indiana program through the Family and Social Services Administration that connects public-assistance recipients with workforce training and employment services. Qualified participants may be referred to ${PLATFORM_DEFAULTS.orgName} programs through their FSSA case worker.`,
  },
  {
    question: 'Can I apply for training while waiting for funding approval?',
    answer:
      'Yes. You can begin our admissions process while waiting for funding determination. Contact our team and we will work with you and your case manager to coordinate enrollment timing.',
  },
  {
    question: 'What programs are eligible for WIOA funding?',
    answer:
      'WIOA-eligible programs must be on Indiana\'s ETPL. Our approved programs include healthcare, skilled trades, and technology certifications. Contact us for the current list of ETPL-approved offerings.',
  },
];

export default function WioaFundedTrainingIndianaPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
          { name: 'WIOA Funded Training Indiana', url: '/wioa-funded-training-indiana' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />

      <SeoAuthorityHubPage
        hero={{
          tag: 'WIOA · Workforce Ready Grant · FSSA IMPACT',
          heading: 'Funded Career Training in Indiana',
          subtitle:
            `Multiple state and federal programs may fund your training at ${PLATFORM_DEFAULTS.orgName}. We are ETPL-approved and WIOA-compliant. WorkOne referrals and FSSA IMPACT referrals are accepted.`,
          primaryCta: { label: 'Apply Now', href: '/apply' },
          secondaryCta: { label: 'Contact Us', href: '/contact' },
        }}
        trustBadges={[
          { label: 'ETPL Approved', detail: 'Indiana ETPL Training Provider' },
          { label: 'WIOA Compliant', detail: 'Federal Workforce Funding' },
          { label: 'WorkOne Partner', detail: 'Referrals Accepted' },
          { label: 'FSSA IMPACT', detail: 'State Program Referrals' },
        ]}
        whoHeading="Who May Qualify"
        whoItems={[
          {
            heading: 'Adults & Dislocated Workers (WIOA Title I)',
            description:
              'Adults 18+ who meet income or employment criteria. Dislocated workers who have lost jobs through layoff or plant closure. Eligibility determined by WorkOne.',
          },
          {
            heading: 'FSSA IMPACT Participants',
            description:
              'Indiana residents receiving SNAP, TANF, or Medicaid who are referred through their FSSA case worker for workforce training and employment services.',
          },
          {
            heading: 'Workforce Ready Grant Applicants',
            description:
              'Indiana adults seeking high-demand credentials. Eligibility and grant amounts are set by DWD. Apply through the Indiana Department of Workforce Development.',
          },
          {
            heading: 'Reentry & JRI Participants',
            description:
              'Returning citizens and justice-involved individuals may qualify for Justice Reinvestment Initiative (JRI) funding. Coordination through DWD and provider partners.',
          },
          {
            heading: 'Job Ready Indy Participants',
            description:
              'Marion County residents may qualify for Job Ready Indy, a workforce initiative supporting funded career training in Indianapolis.',
          },
          {
            heading: 'Self-Pay & Other Funding',
            description:
              'Participants who do not qualify for public funding may enroll through self-pay or payment plans. Contact us for options.',
          },
        ]}
        funding={{
          heading: 'Indiana Workforce Funding Sources',
          paragraphs: [
            `Indiana has several state and federal programs that fund career training at approved providers like ${PLATFORM_DEFAULTS.orgName}. The right funding source depends on your situation — income, employment history, and agency relationship.`,
            `Most participants work with a WorkOne career advisor or FSSA case worker to determine which funding applies to them. ${PLATFORM_DEFAULTS.orgName} works directly with funding agencies to support your enrollment.`,
          ],
          bullets: [
            'WIOA Title I — adults, dislocated workers, youth (federal)',
            'Workforce Ready Grant — high-demand credentials (state)',
            'FSSA IMPACT — public assistance recipients (state)',
            'Job Ready Indy — Marion County initiative',
            'Justice Reinvestment Initiative (JRI) — returning citizens',
            'SNAP E&T — SNAP recipient employment and training',
          ],
          eligibilityNote:
            `Important: Final funding eligibility is determined by your local WorkOne office, FSSA case worker, or the applicable funding agency — not by ${PLATFORM_DEFAULTS.orgName}. We do not approve or deny funding. Contact us or WorkOne to begin the eligibility process.`,
        }}
        pathwaysHeading="ETPL-Approved Program Areas"
        pathways={[
          {
            name: 'Healthcare Certifications',
            description: 'CNA, HHA, Medical Assistant, Phlebotomy, and Patient Care Tech. Short-term, industry-recognized credentials for Indiana healthcare employers.',
            href: '/healthcare-training-indianapolis',
          },
          {
            name: 'Skilled Trades Certifications',
            description: 'HVAC, electrical, construction, OSHA, and EPA 608. Employer-recognized credentials with registered apprenticeship pathways.',
            href: '/skilled-trades-training-indiana',
          },
          {
            name: 'IT & Digital Skills',
            description: 'CompTIA A+, Network+, Security+, Microsoft certifications, and cybersecurity. In-demand credentials for Indianapolis area IT employers.',
            href: '/it-certification-training-indianapolis',
          },
          {
            name: 'See All Programs',
            description: 'Browse the full program catalog to find training that matches your career goals and funding eligibility.',
            href: '/programs',
          },
        ]}
        faqs={faqs}
        relatedLinks={[
          { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
          { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
          { label: 'Skilled Trades', href: '/skilled-trades-training-indiana' },
          { label: 'IT Programs', href: '/it-certification-training-indianapolis' },
          { label: 'Agency Referrals', href: '/agency-referral-workforce-training-indiana' },
          { label: 'How Funding Works', href: '/funding/how-it-works' },
          { label: 'Contact Us', href: '/contact' },
        ]}
        complianceNotes={[
          `Funding eligibility under WIOA, Workforce Ready Grant, FSSA IMPACT, or any other program is determined by the applicable workforce agency or WorkOne office, not by ${PLATFORM_DEFAULTS.orgName}. Approval is not guaranteed.`,
          `${PLATFORM_DEFAULTS.orgName} is listed on Indiana's Eligible Training Provider List (ETPL). ETPL listing does not guarantee funding for all participants.`,
          `${PLATFORM_DEFAULTS.orgName} is a workforce training provider. We do not grant degrees and do not hold regional academic accreditation.`,
          'Content reviewed 2026. Program availability, funding amounts, and eligibility requirements are subject to change. Verify current program details with DWD or your WorkOne office.',
        ]}
        ctaHeading="Ready to Start Funded Training?"
        ctaSubtitle="Apply now or contact us to connect with a WorkOne advisor and find the right funding path for you."
        ctaPrimary={{ label: 'Apply Now', href: '/apply' }}
        ctaSecondary={{ label: 'Contact Us', href: '/contact' }}
      />
    </>
  );
}
