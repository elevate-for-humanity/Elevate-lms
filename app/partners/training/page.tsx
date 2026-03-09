
import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

export const metadata: Metadata = {
  title: 'Training Provider Partnership | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity as a training provider. Co-deliver programs, share facilities, and expand your reach.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/training' },
};

export default function TrainingPartnerPage() {

  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Training' }],
      hero: {
        image: '/images/pages/training-cohort.jpg',
        tag: 'Training Partners',
        title: 'Training Provider Partnership',
        subtitle: 'Co-deliver workforce training programs and expand your reach through our enrollment pipeline and funding network.',
      },
      intro: {
        heading: 'Expand Your Training Capacity',
        paragraphs: [
          'Elevate for Humanity partners with training providers to co-deliver programs in healthcare, skilled trades, CDL, technology, and cosmetology. We bring the students, funding, and support services — you bring the expertise.',
          'Our partnerships are structured to maximize enrollment, improve completion rates, and ensure graduates are job-ready.',
        ],
        image: '/images/pages/comp-pathway-trades.jpg',
      },
      features: {
        heading: 'What We Bring to the Partnership',
        items: [
          'Student enrollment pipeline from WorkOne and community referrals',
          'WIOA, WRG, and JRI funding for eligible participants',
          'LMS platform for blended learning delivery',
          'Career services and job placement for graduates',
          'Compliance and outcome reporting',
          'Marketing and community outreach',
        ],
      },
      cta: {
        heading: 'Interested in Partnering?',
        subtitle: 'Let\'s discuss how we can work together to train the next generation of workers.',
        primaryLabel: 'Contact Us',
        primaryHref: '/contact',
        secondaryLabel: 'View Programs',
        secondaryHref: '/programs',
      },
    }} />
  );
}
