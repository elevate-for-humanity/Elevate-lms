import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, ServiceStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/employer-workforce-partnerships-indiana';

export const metadata: Metadata = {
  title: 'Employer Workforce Partnerships Indiana | OJT, Apprenticeships & Wage Reimbursement',
  description:
    `Partner with ${PLATFORM_DEFAULTS.orgName} for OJT wage reimbursement, registered apprenticeships, WOTC tax credits, and trained workforce candidates across Indiana.`,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Employer Workforce Partnerships Indiana | OJT & Apprenticeships',
    description:
      'OJT wage reimbursement, registered apprenticeships, WOTC tax credits, and trained candidates. Partner with Indiana\'s workforce training provider.',
    url: CANONICAL,
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Employer Workforce Partnerships Indiana' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Employer Workforce Partnerships Indiana',
    description: 'OJT wage reimbursement, registered apprenticeships, WOTC tax credits. Partner with Indiana\'s workforce training provider.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: 'What is OJT wage reimbursement and how do employers qualify?',
    answer:
      `On-the-job training (OJT) wage reimbursement is a WIOA-authorized program that reimburses eligible employers for a portion of wages paid to a new hire during their structured training period. Reimbursement rates and eligibility are determined by the local WorkOne workforce board, not by ${PLATFORM_DEFAULTS.orgName}. Contact your local WorkOne Business Services representative or our team to explore eligibility.`,
  },
  {
    question: 'What is the Work Opportunity Tax Credit (WOTC)?',
    answer:
      'WOTC is a federal tax credit available to employers who hire individuals from certain target groups, including SNAP recipients, veterans, ex-felons, and others. Tax credit amounts vary by target group and hours worked. WOTC certification is administered by the Indiana Department of Workforce Development (DWD). Consult a qualified tax advisor for guidance on your specific situation.',
  },
  {
    question: 'What is a registered apprenticeship?',
    answer:
      `DOL-registered apprenticeships are work-based learning programs that combine paid on-the-job training with related technical instruction. Apprentices earn wages while learning. ${PLATFORM_DEFAULTS.orgName} is a DOL-registered apprenticeship sponsor and can work with employers to develop or join apprenticeship programs.`,
  },
  {
    question: `What industries and occupations does ${PLATFORM_DEFAULTS.orgName} train in?`,
    answer:
      'We train in healthcare (CNA, HHA, Medical Assistant), skilled trades (HVAC, electrical, construction, EPA 608), and technology (IT help desk, cybersecurity, digital literacy). Our programs are designed to meet the hiring needs of Indiana employers in high-demand sectors.',
  },
  {
    question: 'Is there a fee to access the employer partnership program?',
    answer:
      `There is no recruiting fee for employer partners accessing trained candidates from ${PLATFORM_DEFAULTS.orgName} programs. Some OJT and apprenticeship coordination services may have associated administrative steps — contact us for current details.`,
  },
  {
    question: 'How do we get started as an employer partner?',
    answer:
      'Contact our employer partnership team through our Contact page or by calling our office. We will connect you with the right program based on your industry, hiring needs, and workforce goals.',
  },
];

export default function EmployerWorkforcePartnershipsIndianaPage() {
  return (
    <>
      <ServiceStructuredData
        name="Employer Workforce Partnership Program"
        description="Employer workforce partnership services including OJT wage reimbursement, registered apprenticeships, WOTC tax credit support, and trained candidate pipelines for Indiana employers."
        url="/employer-workforce-partnerships-indiana"
        providerType="Organization"
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
          { name: 'Employer Workforce Partnerships Indiana', url: '/employer-workforce-partnerships-indiana' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />

      <SeoAuthorityHubPage
        hero={{
          tag: 'OJT · Apprenticeships · WOTC · Indiana',
          heading: 'Employer Workforce Partnerships in Indiana',
          subtitle:
            `Partner with ${PLATFORM_DEFAULTS.orgName} to access trained, certified candidates in healthcare, skilled trades, and technology — plus OJT wage reimbursement, registered apprenticeship programs, and Work Opportunity Tax Credit support.`,
          primaryCta: { label: 'Contact Us', href: '/contact' },
          secondaryCta: { label: 'See Details', href: '/employer/dashboard' },
        }}
        trustBadges={[
          { label: 'DOL Registered', detail: 'Apprenticeship Sponsor' },
          { label: 'OJT Partner', detail: 'WIOA Wage Reimbursement' },
          { label: 'WOTC Support', detail: 'Federal Tax Credit' },
          { label: 'No Recruiting Fee', detail: 'Partner Employers' },
        ]}
        whoHeading="Who Employer Partnerships Are For"
        whoItems={[
          {
            heading: 'Healthcare Employers',
            description:
              'Hospitals, long-term care facilities, home health agencies, and physician practices seeking trained CNA, HHA, and medical support candidates.',
          },
          {
            heading: 'HVAC & Skilled Trades Contractors',
            description:
              'HVAC contractors, electrical companies, and construction firms seeking EPA 608-certified and OSHA-trained candidates and apprenticeship program development.',
          },
          {
            heading: 'Technology Employers',
            description:
              'IT service firms, managed service providers, and corporate IT departments seeking CompTIA-certified IT support and cybersecurity candidates.',
          },
          {
            heading: 'OJT Employers',
            description:
              'Employers who want to hire and train new workers with WIOA OJT wage reimbursement support, reducing the cost of onboarding and training.',
          },
          {
            heading: 'Apprenticeship Employers',
            description:
              'Companies interested in developing DOL-registered apprenticeship programs that build long-term workforce pipelines through earn-as-you-learn models.',
          },
          {
            heading: 'Training Site Partners',
            description:
              'Facilities willing to host clinical, lab, or on-the-job training components for healthcare and skilled trades programs in the Indianapolis area.',
          },
        ]}
        pathwaysHeading="Partnership Pathways"
        pathways={[
          {
            name: 'OJT Wage Reimbursement',
            description:
              'Eligible employers can receive reimbursement for a portion of new hire wages during structured on-the-job training. Rates and eligibility set by WorkOne.',
            href: '/employer/dashboard',
          },
          {
            name: 'Registered Apprenticeship',
            description:
              `DOL-registered apprenticeship programs combining paid employment with structured technical instruction. ${PLATFORM_DEFAULTS.orgName} is a registered apprenticeship sponsor.`,
            href: '/apprenticeships',
          },
          {
            name: 'Candidate Pipeline',
            description:
              'Access pre-screened, trained candidates in healthcare, skilled trades, and technology. No recruiting fee for partner employers.',
            href: '/contact',
          },
          {
            name: 'Work Opportunity Tax Credit (WOTC)',
            description:
              'Federal tax credit for hiring from qualifying target groups. WOTC certification through Indiana DWD. Consult a tax advisor for your specific situation.',
            href: '/employer/dashboard',
          },
          {
            name: 'Training Site Partnership',
            description:
              `Host clinical hours, lab components, or OJT placements for healthcare and trades programs. Support ${PLATFORM_DEFAULTS.orgName} students while building your own workforce pipeline.`,
            href: '/contact',
          },
          {
            name: 'Customized Training',
            description:
              `Work with ${PLATFORM_DEFAULTS.orgName} to design training programs tailored to your industry, occupation, and workforce development goals.`,
            href: '/contact',
          },
        ]}
        faqs={faqs}
        relatedLinks={[
          { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
          { label: 'Agency Referrals', href: '/agency-referral-workforce-training-indiana' },
          { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
          { label: 'Skilled Trades Programs', href: '/skilled-trades-training-indiana' },
          { label: 'IT Programs', href: '/it-certification-training-indianapolis' },
          { label: 'All Programs', href: '/programs' },
          { label: 'Employers Page', href: '/employer/dashboard' },
          { label: 'Contact Us', href: '/contact' },
        ]}
        complianceNotes={[
          `OJT wage reimbursement eligibility and rates are determined by the applicable WIOA local workforce board and WorkOne office, not by ${PLATFORM_DEFAULTS.orgName}. Contact your local WorkOne Business Services representative to determine eligibility.`,
          `Work Opportunity Tax Credit (WOTC) eligibility and credit amounts are governed by federal tax law and administered by the Indiana Department of Workforce Development (DWD). Consult a qualified tax advisor or CPA for guidance on your specific situation. ${PLATFORM_DEFAULTS.orgName} does not provide tax advice.`,
          'Registered apprenticeship programs are governed by the U.S. Department of Labor. Program development and registration requirements are set by DOL and the Indiana Apprenticeship Office.',
          'Employment and candidate outcomes are not guaranteed. Employer partnerships are subject to program availability and eligibility determination by the applicable workforce agency.',
          'Content reviewed 2026.',
        ]}
        ctaHeading="Partner with Indiana's Workforce Training Provider"
        ctaSubtitle="Contact our employer partnership team to explore OJT, apprenticeships, and candidate pipelines for your business."
        ctaPrimary={{ label: 'Contact Us', href: '/contact' }}
        ctaSecondary={{ label: 'Learn About OJT & WOTC', href: '/employer/dashboard' }}
      />
    </>
  );
}
