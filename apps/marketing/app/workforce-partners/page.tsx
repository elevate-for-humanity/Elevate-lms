import type { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Workforce Partners | Elevate for Humanity',
  description:
    'Partner with Elevate for Humanity to connect your clients to funded career training, credentials, and job placement in Indiana.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-partners' },
};

export default function WorkforcePartnersPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Workforce Partners' }],
        hero: {
          image: '/images/pages/about-career-training.webp',
          tag: 'Workforce Partners',
          tagColor: 'text-brand-blue-600',
          title: 'Connect Your Clients to Careers',
          subtitle: 'WorkOne centers, reentry organizations, social service agencies, and workforce boards partner with Elevate to move participants from benefits to employment.',
        },
        intro: {
          heading: 'Built for Workforce System Partners',
          paragraphs: [
            'Elevate for Humanity is an Indiana ETPL-listed training provider and DOL Registered Apprenticeship Sponsor. We work directly with WorkOne centers, FSSA, reentry programs, and community organizations to enroll eligible participants in funded training.',
            'Our programs are designed for WIOA co-enrollment, Workforce Ready Grant referrals, and JRI funding. We handle enrollment, training delivery, credential testing, and job placement — your team focuses on case management.',
          ],
          image: '/images/pages/about-employer-partners.webp',
        },
        features: {
          heading: 'What Partners Get',
          items: [
            'ETPL-listed programs eligible for WIOA Individual Training Accounts',
            'DOL Registered Apprenticeship programs for OJT funding',
            'Workforce Ready Grant approved programs',
            'JRI and FSSA IMPACT program co-enrollment support',
            'Real-time enrollment and progress reporting for case managers',
            'Dedicated partner liaison for referral coordination',
            'Flexible start dates and cohort scheduling',
            'Job placement tracking and 90-day employment verification',
          ],
        },
        steps: {
          heading: 'How Referrals Work',
          items: [
            { title: 'Send a Referral', desc: 'Email or call your partner liaison with the participant\'s name and program interest.' },
            { title: 'Eligibility Screening', desc: 'We screen for WIOA, WRG, or self-pay eligibility within 24 hours.' },
            { title: 'Enrollment', desc: 'Participant completes intake, signs enrollment agreement, and starts training.' },
            { title: 'Progress Updates', desc: 'Case managers receive milestone updates: enrollment, completion, credential, placement.' },
          ],
        },
        cta: {
          heading: 'Become a Referral Partner',
          subtitle: 'Contact us to set up a referral agreement. Call (317) 314-3757 or use the form below.',
          primaryLabel: 'Contact Us',
          primaryHref: '/contact',
          secondaryLabel: 'View Programs',
          secondaryHref: '/programs',
          bgColor: 'bg-brand-blue-700',
        },
      }}
    />
  );
}
