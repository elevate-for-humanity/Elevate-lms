export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Workforce Development Partnership | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity on workforce development. WIOA-funded training, apprenticeship programs, and employer pipeline services.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/workforce' },
};

export default async function WorkforcePage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('partners').select('*').limit(50);

  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Workforce' }],
      hero: {
        image: '/images/heroes/workforce-partner-4.jpg',
        tag: 'Partnership',
        tagColor: 'text-brand-blue-300',
        title: 'Workforce Development Partnership',
        subtitle: 'Connect your workforce board or agency with ETPL-approved training programs and a pipeline of certified candidates.',
      },
      intro: {
        heading: 'Build Your Local Workforce Pipeline',
        paragraphs: [
          'Elevate for Humanity partners with workforce development boards, WorkOne offices, and state agencies to deliver WIOA-funded training in high-demand fields. Our programs are ETPL-approved and produce industry-certified graduates ready for employment.',
          'We handle enrollment, training delivery, certification testing, and job placement — giving your agency a turnkey training partner with measurable outcomes.',
        ],
        image: '/images/trades/program-welding-training.jpg',
      },
      features: {
        heading: 'Partnership Benefits',
        items: [
          'ETPL-approved training programs across multiple industries',
          'Registered Apprenticeship programs (DOL-approved)',
          'Real-time enrollment and outcome reporting',
          'Dedicated point of contact for your agency',
          'Job placement support and employer connections',
          'Flexible scheduling — day, evening, and weekend cohorts',
        ],
      },
      steps: {
        heading: 'How to Partner',
        items: [
          { title: 'Contact Us', desc: 'Reach out to discuss your workforce needs and participant volume.' },
          { title: 'Review Programs', desc: 'We\'ll match your population to the right training programs and funding streams.' },
          { title: 'Refer Participants', desc: 'Send eligible participants directly. We handle enrollment and training.' },
          { title: 'Track Outcomes', desc: 'Receive completion, certification, and employment outcome reports.' },
        ],
      },
      cta: {
        heading: 'Ready to Partner?',
        subtitle: 'Contact us to discuss workforce development partnership opportunities.',
        primaryLabel: 'Contact Us',
        primaryHref: '/contact',
        secondaryLabel: 'View Programs',
        secondaryHref: '/programs',
      },
    }} />
  );
}
