export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Become a Partner | Elevate for Humanity',
  description: 'Join the Elevate for Humanity partner network. Workforce agencies, employers, training providers, and community organizations.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/join' },
};

export default async function JoinPartnerPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('partners').select('*').limit(50);

  return (
    <PublicLandingPage config={{
      breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'Join' }],
      hero: {
        image: '/images/artlist/office-meeting.jpg',
        title: 'Become a Partner',
        subtitle: 'Join our network of workforce agencies, employers, and community organizations building career pathways.',
      },
      intro: {
        heading: 'Partner With Us',
        paragraphs: [
          'Elevate for Humanity works with workforce development boards, employers, training providers, reentry organizations, and community agencies to deliver career training and employment services.',
          'Whether you want to refer participants, hire graduates, co-deliver training, or support our mission — we have a partnership model that fits.',
        ],
      },
      features: {
        heading: 'Partnership Types',
        items: [
          'Workforce Agency — refer funded participants to our training programs',
          'Employer — hire certified graduates and host apprentices',
          'Training Provider — co-deliver programs and share resources',
          'Reentry Organization — connect justice-involved individuals to JRI-funded training',
          'Community Organization — refer clients facing barriers to employment',
          'Philanthropic — fund training, supplies, and support services',
        ],
      },
      steps: {
        heading: 'Getting Started',
        items: [
          { title: 'Contact Us', desc: 'Tell us about your organization and what you\'re looking for.' },
          { title: 'Explore Options', desc: 'We\'ll identify the right partnership model and programs.' },
          { title: 'Formalize Agreement', desc: 'Sign an MOU or partnership agreement.' },
          { title: 'Launch', desc: 'Start referring participants, hiring graduates, or co-delivering programs.' },
        ],
      },
      cta: {
        heading: 'Ready to Partner?',
        subtitle: 'Contact us to discuss partnership opportunities.',
        primaryLabel: 'Contact Us',
        primaryHref: '/contact',
        secondaryLabel: 'View Programs',
        secondaryHref: '/programs',
      },
    }} />
  );
}
