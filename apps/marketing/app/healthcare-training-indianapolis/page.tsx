import { Metadata } from 'next';
import { FAQStructuredData, BreadcrumbStructuredData, ProgramStructuredData } from '@/components/seo/StructuredData';
import SeoAuthorityHubPage from '@/components/seo/SeoAuthorityHubPage';

export const dynamic = 'force-static';

const CANONICAL = 'https://www.elevateforhumanity.org/healthcare-training-indianapolis';

export const metadata: Metadata = {
  title: 'Healthcare Training Indianapolis | CNA, HHA & Medical Assistant | Elevate for Humanity',
  description:
    'CNA, HHA, Medical Assistant, and Patient Care Technician training in Indianapolis. State-approved programs. WIOA funding may be available for eligible Indiana residents.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Healthcare Training Indianapolis | CNA, HHA & Medical Assistant',
    description:
      'CNA, HHA, Medical Assistant, Phlebotomy, and Patient Care Tech training in Indianapolis. State-approved. WIOA funding may be available.',
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
      'Our CNA training program follows Indiana State Department of Health (ISDH) training hour requirements. Graduates are eligible to sit for the Indiana Nurse Aide Competency Evaluation. Final certification is issued by the Indiana State Department of Health through the testing and registry process, not by Elevate for Humanity.',
  },
  {
    question: 'Does the program include clinical or on-the-job training?',
    answer:
      'Healthcare programs include hands-on clinical or lab components where applicable to meet state and industry requirements. Our CNA program includes required clinical hours at approved healthcare facilities.',
  },
  {
    question: 'Can WIOA pay for healthcare training?',
    answer:
      'Many participants have received WIOA funding for healthcare training at Elevate for Humanity. However, WIOA eligibility is determined by your local WorkOne office, not by us. Contact WorkOne or our admissions team to begin the eligibility process.',
  },
  {
    question: 'What does "third-party credentialing" mean?',
    answer:
      'Credentials like CNA, HHA, or Medical Assistant certifications are issued by independent certifying bodies or state agencies — not by Elevate for Humanity. We prepare you for the examination; the certifying organization determines pass/fail and issues the credential.',
  },
  {
    question: 'Do you help place graduates with healthcare employers?',
    answer:
      'Yes. We work with Indianapolis and Indiana healthcare employers to connect trained graduates with job opportunities. Employment outcomes are not guaranteed and depend on individual performance, credential attainment, and local market conditions.',
  },
];

export default function HealthcareTrainingIndianapolisPage() {
  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Workforce Training Indianapolis', url: '/workforce-training-indianapolis' },
          { name: 'Healthcare Training Indianapolis', url: '/healthcare-training-indianapolis' },
        ]}
      />
      <FAQStructuredData faqs={faqs} />
      <ProgramStructuredData
        name="Healthcare Training Programs"
        description="CNA, HHA, Medical Assistant, Phlebotomy, and Patient Care Technician training in Indianapolis. State-approved. WIOA funding may be available."
        url="/healthcare-training-indianapolis"
        category="Healthcare"
      />

      <SeoAuthorityHubPage
        hero={{
          tag: 'CNA · HHA · Medical Assistant · Indianapolis',
          heading: 'Healthcare Career Training in Indianapolis',
          subtitle:
            'Train for a career in Indiana\'s growing healthcare industry. Elevate for Humanity offers state-supervised CNA, HHA, Medical Assistant, and Patient Care Technician programs in Indianapolis. WIOA funding may be available for eligible residents.',
          primaryCta: { label: 'Apply Now', href: '/apply' },
          secondaryCta: { label: 'View Programs', href: '/programs/healthcare' },
        }}
        trustBadges={[
          { label: 'State-Supervised CNA Training', detail: 'ISDH Requirements' },
          { label: 'ETPL Approved', detail: 'Indiana Training Provider List' },
          { label: 'WIOA Eligible Programs', detail: 'WorkOne Referrals Accepted' },
          { label: 'Employer Placement Support', detail: 'Indianapolis Healthcare Network' },
        ]}
        whoHeading="Who Healthcare Training Is For"
        whoItems={[
          {
            heading: 'Adults Entering Healthcare',
            description:
              'Adults 18+ with no prior healthcare experience who want to enter the industry quickly through a short-term certificate program.',
          },
          {
            heading: 'CNA Candidates',
            description:
              'Individuals seeking Certified Nursing Assistant credentials to work in long-term care, hospitals, and home settings across Indiana.',
          },
          {
            heading: 'Home Health Aide Candidates',
            description:
              'Adults seeking to provide in-home healthcare support. HHA training prepares you for state registry and direct-care employment.',
          },
          {
            heading: 'Medical Office & Clinical Support',
            description:
              'Individuals interested in Medical Assisting, phlebotomy, or patient care support roles in physician offices, clinics, and hospitals.',
          },
          {
            heading: 'WIOA & Agency Referrals',
            description:
              'Participants referred by WorkOne, FSSA, or other workforce agencies for healthcare training. We work with your case manager to coordinate enrollment.',
          },
          {
            heading: 'Career Changers',
            description:
              'Individuals leaving other industries and seeking stable, in-demand careers in Indiana\'s healthcare sector.',
          },
        ]}
        funding={{
          heading: 'Funding for Healthcare Training',
          paragraphs: [
            'Healthcare programs at Elevate for Humanity are ETPL-approved, which means eligible Indiana residents may fund their training through WIOA, Workforce Ready Grant, or FSSA IMPACT.',
            'Healthcare is consistently listed among Indiana\'s high-demand occupation sectors, which may increase funding eligibility for some programs. Your WorkOne advisor can confirm your specific options.',
          ],
          bullets: [
            'WIOA Individual Training Account (ITA) — adults and dislocated workers',
            'Workforce Ready Grant — high-demand credentials (DWD eligibility required)',
            'FSSA IMPACT — public-assistance recipient referrals',
            'Job Ready Indy — Marion County initiative',
            'Self-pay and payment plan options available',
          ],
          eligibilityNote:
            'Funding eligibility is determined by your local WorkOne office, FSSA case worker, or the applicable agency — not by Elevate for Humanity. Contact us or WorkOne to start the process.',
        }}
        pathwaysHeading="Healthcare Training Pathways"
        pathways={[
          {
            name: 'Certified Nursing Assistant (CNA)',
            description:
              'State-supervised CNA training meeting Indiana State Department of Health hours requirements. Prepares graduates for the Indiana Nurse Aide Competency Evaluation and ISDH registry.',
            href: '/programs/cna',
          },
          {
            name: 'Home Health Aide (HHA)',
            description:
              'Training for direct-care roles in home health settings. Prepares participants for home health aide registry and employment with home health agencies.',
            href: '/programs/cna',
          },
          {
            name: 'Medical Assistant / Patient Care Technician',
            description:
              'Clinical and administrative training for medical office and hospital support roles. Phlebotomy, EKG, and patient care components included where applicable.',
            href: '/programs/healthcare',
          },
          {
            name: 'All Healthcare Programs',
            description:
              'See the full catalog of healthcare training programs at Elevate for Humanity.',
            href: '/programs/healthcare',
          },
        ]}
        employer={{
          heading: 'Healthcare Employer Placement',
          paragraphs: [
            'We work with Indianapolis and Indiana healthcare employers — hospitals, long-term care facilities, home health agencies, and physician practices — to connect trained graduates with job opportunities.',
            'Employers can partner with Elevate for Humanity to build a trained candidate pipeline, coordinate OJT reimbursement, and participate in registered apprenticeship pathways.',
          ],
          bullets: [
            'Pre-screened, credentialed healthcare candidates',
            'CNA, HHA, and Medical Assistant pipelines for Indianapolis employers',
            'OJT wage reimbursement coordination for eligible employer partners',
            'No recruiting fee for partner employers',
            'Ongoing workforce training for incumbent employees',
          ],
          cta: { label: 'Employer Partnership Inquiry', href: '/employer-workforce-partnerships-indiana' },
        }}
        faqs={faqs}
        relatedLinks={[
          { label: 'Main Training Hub', href: '/workforce-training-indianapolis' },
          { label: 'WIOA & Funded Training', href: '/wioa-funded-training-indiana' },
          { label: 'Employer Partnerships', href: '/employer-workforce-partnerships-indiana' },
          { label: 'CNA Program', href: '/programs/cna' },
          { label: 'Healthcare Programs', href: '/programs/healthcare' },
          { label: 'Apply Now', href: '/apply' },
          { label: 'Contact Us', href: '/contact' },
        ]}
        complianceNotes={[
          'Healthcare certifications (CNA, HHA, Medical Assistant, Phlebotomy) are issued by independent state agencies or third-party certifying bodies, not by Elevate for Humanity. Passing the credentialing examination is required to earn the credential.',
          'CNA training at Elevate for Humanity follows Indiana State Department of Health (ISDH) training requirements. State registry is maintained by ISDH, not by Elevate for Humanity.',
          'Elevate for Humanity is a workforce training provider. We do not grant degrees and do not hold regional academic accreditation.',
          'Funding eligibility under WIOA, Workforce Ready Grant, FSSA IMPACT, or any other program is determined by the applicable workforce agency, not by Elevate for Humanity.',
          'Employment outcomes are not guaranteed. Results depend on individual performance, credential attainment, and local market conditions. Content reviewed 2026.',
        ]}
        ctaHeading="Start Your Healthcare Career in Indianapolis"
        ctaSubtitle="Apply today or contact our team to learn which healthcare programs and funding options are right for you."
        ctaPrimary={{ label: 'Apply Now', href: '/apply' }}
        ctaSecondary={{ label: 'View Healthcare Programs', href: '/programs/healthcare' }}
      />
    </>
  );
}
