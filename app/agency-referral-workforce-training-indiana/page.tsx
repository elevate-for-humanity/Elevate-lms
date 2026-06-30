import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, ServiceStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/agency-referral-workforce-training-indiana';

export const metadata: Metadata = {
  title: 'Agency Referral Workforce Training Indiana | WorkOne & FSSA IMPACT Partner',
  description:
    'Workforce agency referral partner in Indiana. WorkOne referrals accepted. FSSA IMPACT training provider. ETPL-approved. WIOA-compliant documentation and outcome reporting available.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Agency Referral Workforce Training Indiana | WorkOne & FSSA IMPACT',
    description:
      'Indiana workforce agency referral partner. WorkOne referrals, FSSA IMPACT, ETPL-approved, WIOA-compliant. Outcome tracking and participant support services.',
    url: CANONICAL,
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Agency Referral Workforce Training Indiana' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agency Referral Workforce Training Indiana',
    description: 'Indiana ETPL-approved, WIOA-compliant workforce training provider. WorkOne and FSSA IMPACT referrals accepted.',
    images: ['/og-default.webp'],
  },
};

const faqs = [
  {
    question: `How does a WorkOne office refer participants to ${PLATFORM_DEFAULTS.orgName}?`,
    answer:
      `WorkOne career advisors issue Individual Training Accounts (ITAs) for ETPL-approved programs. Once an ITA is issued for an ${PLATFORM_DEFAULTS.orgName} program, the participant can enroll. Our admissions team works directly with case managers to coordinate enrollment, documentation, and start dates.`,
  },
  {
    question: `What documentation does ${PLATFORM_DEFAULTS.orgName} provide to agencies?`,
    answer:
      'We provide enrollment confirmation, attendance records, progress updates, and completion documentation as required by the applicable program. Specific reporting formats can be coordinated with your agency\'s requirements. Contact our team to discuss your documentation needs.',
  },
  {
    question: 'How does FSSA IMPACT referral work?',
    answer:
      'FSSA IMPACT participants are referred by their FSSA case worker for workforce training services. Once referred, our admissions team coordinates with the FSSA case worker and participant to complete enrollment. We support FSSA documentation and reporting requirements.',
  },
  {
    question: `Does ${PLATFORM_DEFAULTS.orgName} work with reentry and justice-involved participants?`,
    answer:
      'Yes. We serve returning citizens and justice-involved individuals who are referred through reentry programs, Justice Reinvestment Initiative (JRI) partners, or other justice-focused workforce agencies. We do not have automatic barriers to enrollment based on justice history — contact us to discuss specific participant situations.',
  },
  {
    question: `What participant support services does ${PLATFORM_DEFAULTS.orgName} provide?`,
    answer:
      'We provide academic advising, career counseling, job placement support, and wrap-around referral services where available. Support services complement the training program and are designed to help participants complete training and transition to employment.',
  },
  {
    question: 'How does an agency become a referral partner?',
    answer:
      'Contact our partnership team through our Contact page. We will connect you with our agency relations coordinator to discuss your participant population, program options, and referral workflow.',
  },
];

export default function AgencyReferralWorkforceTrainingIndianaPage() {
  return (
    <>
      <ServiceStructuredData
        name="Agency & Workforce Referral Training Services"
        description="ETPL-approved, WIOA-compliant workforce training provider accepting referrals from WorkOne offices, FSSA IMPACT, and other Indiana workforce agencies. Documentation and outcome reporting available."
        url="/agency-referral-workforce-training-indiana"
        providerType="EducationalOrganization"
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
          { name: 'Agency Referral Workforce Training Indiana', url: '/agency-referral-workforce-training-indiana' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />

      <SeoAuthorityHubPage
        hero={{
          tag: 'WorkOne · FSSA IMPACT · ETPL · WIOA · Indiana',
          heading: 'Agency Referral Workforce Training Partner',
          subtitle:
            `${PLATFORM_DEFAULTS.orgName} is an Indiana ETPL-approved, WIOA-compliant workforce training provider accepting referrals from WorkOne offices, FSSA IMPACT case workers, reentry programs, and other workforce agencies across Indiana.`,
          primaryCta: { label: 'Contact Us', href: '/contact' },
          secondaryCta: { label: 'Learn About Funding', href: '/wioa-funded-training-indiana' },
        }}
        trustBadges={[
          { label: 'ETPL Approved', detail: 'Indiana Eligible Training Provider List' },
          { label: 'WIOA Compliant', detail: 'Federal Workforce Standards' },
          { label: 'WorkOne Partner', detail: 'ITA Referrals Accepted' },
          { label: 'FSSA IMPACT', detail: 'State Referrals Accepted' },
        ]}
        whoHeading="Who Can Make Referrals"
        whoItems={[
          {
            heading: 'WorkOne Career Advisors',
            description:
              'WorkOne staff issue Individual Training Accounts (ITAs) for ETPL-approved programs. Our team coordinates directly with case managers on enrollment, documentation, and outcomes.',
          },
          {
            heading: 'FSSA Case Workers',
            description:
              'FSSA IMPACT case workers can refer qualifying public-assistance recipients for workforce training. We support FSSA documentation and reporting requirements.',
          },
          {
            heading: 'Reentry & JRI Coordinators',
            description:
              'Justice Reinvestment Initiative (JRI) partners and reentry coordinators can refer returning citizens for workforce training. We work with your population and timeline.',
          },
          {
            heading: 'DWD Program Staff',
            description:
              'Indiana Department of Workforce Development program staff administering rapid reemployment, layoff recovery, or other workforce initiatives.',
          },
          {
            heading: 'Social Services Case Managers',
            description:
              'Social service organizations referring individuals for workforce training as part of broader case management and self-sufficiency plans.',
          },
          {
            heading: 'Nonprofit Workforce Partners',
            description:
              'Community-based organizations and nonprofits supporting workforce development who want to connect their clients with ETPL-approved training.',
          },
        ]}
        funding={{
          heading: 'Funding & Eligibility Process',
          paragraphs: [
            `${PLATFORM_DEFAULTS.orgName} is listed on Indiana's Eligible Training Provider List (ETPL), which authorizes WorkOne career advisors to issue Individual Training Accounts (ITAs) for our approved programs.`,
            'Agencies refer participants based on their own eligibility criteria. We do not determine funding eligibility — that responsibility stays with your agency. Our role is to deliver high-quality training, maintain attendance and progress records, and support the participant through to credential attainment.',
          ],
          bullets: [
            'ITA issuance through WorkOne for ETPL-approved programs',
            'FSSA IMPACT referral and coordination process',
            'JRI participant intake and documentation',
            'SNAP E&T coordination for qualifying participants',
            'Self-pay enrollment for non-funded participants',
          ],
          eligibilityNote:
            `Final funding eligibility and ITA approval are determined by the referring workforce agency or WorkOne office, not by ${PLATFORM_DEFAULTS.orgName}. Participant eligibility must be established before ITA issuance.`,
        }}
        pathwaysHeading="Programs Available for Agency Referrals"
        pathways={[
          {
            name: 'Healthcare Programs',
            description:
              'CNA, HHA, Medical Assistant, and Patient Care Technician. State-supervised, ETPL-approved programs for healthcare workforce pathways.',
            href: '/healthcare-training-indianapolis',
          },
          {
            name: 'Skilled Trades Programs',
            description:
              'HVAC, EPA 608, OSHA, electrical, and construction. ETPL-approved, DOL apprenticeship-connected programs for trades workforce pathways.',
            href: '/skilled-trades-training-indiana',
          },
          {
            name: 'IT & Digital Skills',
            description:
              'CompTIA, cybersecurity, and digital literacy. ETPL-approved IT programs for technology workforce pathways.',
            href: '/it-certification-training-indianapolis',
          },
          {
            name: 'WIOA & Funding Information',
            description:
              'Detailed information on WIOA funding streams, Workforce Ready Grant, FSSA IMPACT, and other funding sources available to referred participants.',
            href: '/wioa-funded-training-indiana',
          },
        ]}
        employer={{
          heading: 'Employer Connections for Referred Participants',
          paragraphs: [
            `Agency partners benefit from ${PLATFORM_DEFAULTS.orgName}'s employer network. We connect program graduates — including agency-referred participants — with Indianapolis and Indiana employers who are actively hiring.`,
            'Our employer partnerships include OJT wage reimbursement opportunities, which may benefit participants referred through WIOA-funded pathways.',
          ],
          bullets: [
            'Active employer relationships in healthcare, trades, and technology',
            'OJT placement coordination for eligible WorkOne-referred participants',
            'Credential-to-employment tracking for outcome reporting',
            'Employer feedback on graduate performance',
            'Post-placement support and retention check-ins',
          ],
          cta: { label: 'See Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
        }}
        faqs={faqs}
        relatedLinks={[
          { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
          { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
          { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
          { label: 'Healthcare Programs', href: '/healthcare-training-indianapolis' },
          { label: 'Skilled Trades Programs', href: '/skilled-trades-training-indiana' },
          { label: 'IT Programs', href: '/it-certification-training-indianapolis' },
          { label: 'All Programs', href: '/programs' },
          { label: 'Contact Us', href: '/contact' },
        ]}
        complianceNotes={[
          `Funding eligibility and ITA approval under WIOA, Workforce Ready Grant, FSSA IMPACT, or any other program is determined by the applicable workforce agency or WorkOne office, not by ${PLATFORM_DEFAULTS.orgName}.`,
          `${PLATFORM_DEFAULTS.orgName} is listed on Indiana's Eligible Training Provider List (ETPL). ETPL listing does not guarantee funding for all participants — eligibility must be determined by the referring agency.`,
          `Credentials and certifications are issued by independent third-party certifying bodies, not by ${PLATFORM_DEFAULTS.orgName}.`,
          `${PLATFORM_DEFAULTS.orgName} is a workforce training provider. We do not grant degrees and do not hold regional academic accreditation.`,
          'Employment and credential outcomes are not guaranteed. Results depend on individual participant performance and local market conditions.',
          'Content reviewed 2026. Program availability subject to change.',
        ]}
        ctaHeading="Start the Agency Referral Process"
        ctaSubtitle="Contact our partnership team to discuss referral workflows, documentation requirements, and participant support."
        ctaPrimary={{ label: 'Contact Us', href: '/contact' }}
        ctaSecondary={{ label: 'Learn About Funding', href: '/wioa-funded-training-indiana' }}
      />
    </>
  );
}
