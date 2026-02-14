import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'Reentry Partnership | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity on reentry workforce programs. JRI-funded training for justice-involved individuals returning to the workforce.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/reentry' },
};

export default function ReentryPartnerPage() {
  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Reentry' }],
      hero: {
        image: '/images/heroes-hq/jri-hero.jpg',
        tag: 'Reentry Programs',
        tagColor: 'text-green-300',
        title: 'Reentry Workforce Partnership',
        subtitle: 'Help justice-involved individuals build careers through funded training, certifications, and employment support.',
      },
      intro: {
        heading: 'Second Chance Career Training',
        paragraphs: [
          'Elevate for Humanity partners with reentry organizations, community corrections, and probation departments to provide career training for justice-involved individuals. Our programs are funded through JRI and WIOA, removing financial barriers to participation.',
          'We provide hands-on training in high-demand fields where background checks are less restrictive, giving participants a realistic path to stable employment.',
        ],
        image: '/images/trades/program-construction-training.jpg',
      },
      features: {
        heading: 'Program Features',
        items: [
          'JRI funding may cover full tuition for eligible participants',
          'Programs in trades, CDL, healthcare, and barber apprenticeship',
          'Background-friendly employer partnerships',
          'Wrap-around support: transportation, childcare, career counseling',
          'Job placement assistance and employer introductions',
          'Outcome tracking and reporting for your organization',
        ],
      },
      steps: {
        heading: 'How Referrals Work',
        items: [
          { title: 'Identify Candidates', desc: 'Refer individuals who are motivated and eligible for JRI or WIOA funding.' },
          { title: 'We Enroll Them', desc: 'Our team handles eligibility verification, program selection, and enrollment.' },
          { title: 'Training Begins', desc: 'Participants attend hands-on training and earn industry certifications.' },
          { title: 'Employment Support', desc: 'We connect graduates with background-friendly employers hiring in their field.' },
        ],
      },
      cta: {
        heading: 'Partner on Reentry',
        subtitle: 'Contact us to set up a referral pipeline for your reentry population.',
        primaryLabel: 'Contact Us',
        primaryHref: '/contact',
        secondaryLabel: 'JRI Funding Info',
        secondaryHref: '/funding/jri',
        bgColor: 'bg-green-700',
      },
    }} />
  );
}
