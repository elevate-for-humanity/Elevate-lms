import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, OrganizationStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/workforce-training-indianapolis';

export const metadata: Metadata = {
  title: 'Workforce Training Indianapolis | Funded Career Certifications',
  description:
    'Indianapolis workforce training provider. WIOA-funded, state-approved career certifications in healthcare, skilled trades, and IT. Serving Indianapolis and all of Indiana.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Workforce Training Indianapolis',
    description:
      'WIOA-funded career training in healthcare, skilled trades, and IT. Indianapolis and Indiana-wide. Employer placement pipeline. Agency referrals accepted.',
    url: CANONICAL,
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Workforce Training Indianapolis' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Workforce Training Indianapolis',
    description: 'WIOA-funded career training in healthcare, skilled trades, and IT. Indianapolis and Indiana-wide.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: `What is ${PLATFORM_DEFAULTS.orgName}?`,
    answer:
      `${PLATFORM_DEFAULTS.orgName} is a nonprofit workforce development organization and Indiana ETPL-approved training provider headquartered in Indianapolis. We deliver career certification programs in healthcare, skilled trades, and technology. ${PLATFORM_DEFAULTS.orgName} is a workforce training provider, not a degree-granting institution.`,
  },
  {
    question: 'Who qualifies for no-cost or low-cost training?',
    answer:
      `Funding eligibility—including WIOA, Workforce Ready Grant, and FSSA IMPACT—is determined by your local workforce agency or WorkOne office, not by ${PLATFORM_DEFAULTS.orgName}. Contact us or your nearest WorkOne center to start the eligibility process.`,
  },
  {
    question: 'What programs are available in Indianapolis?',
    answer:
      'We offer training in certified nursing assistant (CNA), home health aide (HHA), medical assisting, HVAC, electrical, construction, EPA 608, IT help desk, cybersecurity, and more. Visit our Programs page for the current catalog.',
  },
  {
    question: 'How do I apply?',
    answer:
      'You can apply online at elevateforhumanity.org/apply or contact our admissions team. If you are referred through WorkOne or a workforce agency, your case manager will coordinate enrollment.',
  },
  {
    question: `Does ${PLATFORM_DEFAULTS.orgName} work with employers?`,
    answer:
      'Yes. We provide employer partners with pre-screened, trained candidates, OJT wage reimbursement coordination, registered apprenticeship pathways, and Work Opportunity Tax Credit (WOTC) support. See our Employer Partnerships page.',
  },
];

export default function WorkforceTrainingIndianapolisPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />
      <OrganizationStructuredData />

      <SeoAuthorityHubPage
        hero={{
          tag: 'Indianapolis · Indiana',
          heading: 'Workforce Training & Career Certifications in Indianapolis',
          subtitle:
            `${PLATFORM_DEFAULTS.orgName} is Indiana's ETPL-approved, WIOA-compliant workforce training provider. We connect adults with funded career certifications in healthcare, skilled trades, and technology — and connect graduates with hiring employers.`,
          primaryCta: { label: 'Apply Now', href: '/apply' },
          secondaryCta: { label: 'Explore Programs', href: '/programs' },
        }}
        trustBadges={[
          { label: 'ETPL Approved', detail: 'Indiana Eligible Training Provider List' },
          { label: 'DOL Registered', detail: 'Apprenticeship Sponsor' },
          { label: 'WIOA Compliant', detail: 'WorkOne Referrals Accepted' },
          { label: 'Nonprofit 501(c)(3)', detail: 'Indianapolis, Indiana' },
        ]}
        whoHeading="Who We Serve"
        whoItems={[
          {
            heading: 'Adult Job Seekers',
            description:
              'Adults 18+ who want industry-recognized certifications in high-demand fields. WIOA funding may cover tuition for eligible Indiana residents.',
          },
          {
            heading: 'WorkOne & Agency Referrals',
            description:
              'WorkOne case managers, FSSA IMPACT staff, and reentry coordinators can refer participants directly. We have documentation and reporting processes in place.',
          },
          {
            heading: 'Employers Hiring Locally',
            description:
              'Employers seeking trained, certified candidates and OJT wage reimbursement partnerships. We pre-screen and train candidates aligned to your workforce needs.',
          },
          {
            heading: 'Career Changers',
            description:
              'Adults re-entering the workforce, changing careers, or upskilling in healthcare, trades, or technology through short-term certificate programs.',
          },
          {
            heading: 'Underserved Populations',
            description:
              'We serve returning citizens, low-income adults, and individuals receiving public assistance who qualify for specialized workforce funding streams.',
          },
          {
            heading: 'Apprenticeship Candidates',
            description:
              'Individuals seeking DOL-registered apprenticeship pathways in skilled trades and healthcare, combining paid work experience with structured training.',
          },
        ]}
        funding={{
          heading: 'Funding & No-Cost Training Options',
          paragraphs: [
            `Many Indianapolis and Indiana residents qualify for funded workforce training through federal and state programs. As an ETPL-approved provider, ${PLATFORM_DEFAULTS.orgName} is authorized to accept funding referrals from approved agencies.`,
            `The most common funding sources for our participants are the Workforce Innovation and Opportunity Act (WIOA), the Workforce Ready Grant, and FSSA IMPACT. Eligibility is determined by the referring agency, not by ${PLATFORM_DEFAULTS.orgName}.`,
          ],
          bullets: [
            'WIOA — federal workforce funding for eligible adults and dislocated workers',
            'Workforce Ready Grant — Indiana state funding for in-demand credentials',
            'FSSA IMPACT — state program for qualifying public-assistance recipients',
            'Job Ready Indy — Marion County workforce initiative',
            'Justice Reinvestment Initiative (JRI) — reentry workforce funding',
          ],
          eligibilityNote:
            `Final funding eligibility is determined by your local WorkOne office or workforce agency, not by ${PLATFORM_DEFAULTS.orgName}. Contact us or WorkOne to start the eligibility process.`,
        }}
        pathwaysHeading="Training Program Areas"
        pathways={[
          {
            name: 'Healthcare Training',
            description: 'CNA, HHA, Medical Assistant, Phlebotomy, and Patient Care Technician programs. State-approved credentials for Indiana healthcare employment.',
            href: '/healthcare-training-indianapolis',
          },
          {
            name: 'Skilled Trades Training',
            description: 'HVAC, electrical, construction, OSHA safety, and EPA 608 refrigerant certification. DOL-registered apprenticeship pathways available.',
            href: '/skilled-trades-training-indiana',
          },
          {
            name: 'IT & Digital Skills',
            description: 'CompTIA, Microsoft, cybersecurity, and digital literacy certifications. Industry-recognized credentials for Indianapolis tech employers.',
            href: '/it-certification-training-indianapolis',
          },
          {
            name: 'WIOA & Funded Training',
            description: 'Understand your funding options including WIOA, Workforce Ready Grant, FSSA IMPACT, and Job Ready Indy.',
            href: '/wioa-funded-training-indiana',
          },
          {
            name: 'Employer Partnerships',
            description: 'OJT wage reimbursement, registered apprenticeships, WOTC tax credits, and trained candidate pipelines for Indiana employers.',
            href: '/employer-workforce-partnerships-indiana',
          },
          {
            name: 'Agency Referrals',
            description: 'WorkOne, FSSA IMPACT, and workforce agency referral process. ETPL-approved, WIOA-compliant, with outcome reporting available.',
            href: '/agency-referral-workforce-training-indiana',
          },
        ]}
        employer={{
          heading: 'Employer Placement Pipeline',
          paragraphs: [
            `${PLATFORM_DEFAULTS.orgName} works directly with Indianapolis and Indiana employers to fill open positions with trained, certified candidates — at no recruiting fee.`,
            'We support OJT wage reimbursement programs, DOL-registered apprenticeships, and Work Opportunity Tax Credit (WOTC) eligibility for qualifying hires.',
          ],
          bullets: [
            'Pre-screened, certified candidates across healthcare, trades, and IT',
            'OJT wage reimbursement coordination (eligible employers, up to 75%)',
            'WOTC tax credit support for qualifying new hires',
            'DOL-registered apprenticeship program sponsorship',
            'No recruiting fee for employer partners',
          ],
          cta: { label: 'Become an Employer Partner', href: '/employer-workforce-partnerships-indiana' },
        }}
        faqs={faqs}
        relatedLinks={[
          { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
          { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
          { label: 'Skilled Trades', href: '/skilled-trades-training-indiana' },
          { label: 'IT & Digital Skills', href: '/it-certification-training-indianapolis' },
          { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
          { label: 'Agency Referrals', href: '/agency-referral-workforce-training-indiana' },
          { label: 'All Programs', href: '/programs' },
          { label: 'How Funding Works', href: '/funding/how-it-works' },
          { label: 'Contact Us', href: '/contact' },
        ]}
        complianceNotes={[
          `${PLATFORM_DEFAULTS.orgName} is a workforce training provider. We do not grant degrees and do not hold regional academic accreditation. Credentials and certifications are awarded by independent third-party certifying bodies.`,
          `Funding eligibility under WIOA, Workforce Ready Grant, FSSA IMPACT, or any other program is determined by the applicable workforce agency or WorkOne office, not by ${PLATFORM_DEFAULTS.orgName}. Approval is not guaranteed.`,
          'Outcomes, wages, and employment are not guaranteed. Results vary based on individual effort, local market conditions, and employer hiring decisions.',
          'Content reviewed 2026. Program availability subject to change.',
        ]}
        ctaHeading="Start Your Career in Indianapolis"
        ctaSubtitle="Apply today or contact our team to learn which programs and funding options are available for you."
        ctaPrimary={{ label: 'Apply Now', href: '/apply' }}
        ctaSecondary={{ label: 'Contact Us', href: '/contact' }}
      />
    </>
  );
}
