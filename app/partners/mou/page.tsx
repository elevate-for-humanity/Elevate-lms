export const revalidate = 3600;

import { Metadata } from 'next';
import PublicLandingPage from '@/components/marketing/PublicLandingPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Memorandum of Understanding',
  description:
    `MOU partnership framework for workforce agencies, employers, and training providers partnering with ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/mou' },
};

export default function MOUPage() {
  return (
    <PublicLandingPage
      config={{
        breadcrumbs: [{ label: 'Partners', href: '/partners' }, { label: 'MOU' }],
        hero: {
          image: '/images/pages/about-partners-hero.webp',
          tag: 'Partnership Framework',
          title: 'Memorandum of Understanding',
          subtitle:
            `Formalize your partnership with ${PLATFORM_DEFAULTS.orgName} through a structured MOU agreement.`,
        },
        intro: {
          heading: 'Partnership Agreement Framework',
          paragraphs: [
            `Our Memorandum of Understanding (MOU) establishes the terms, responsibilities, and expectations for partnerships between ${PLATFORM_DEFAULTS.orgName} and workforce agencies, employers, training providers, and community organizations.`,
            'The MOU covers participant referral processes, data sharing protocols, outcome reporting requirements, and the roles and responsibilities of each party.',
            'Contact us to request an MOU template or discuss partnership terms specific to your organization.',
          ],
        },
        features: {
          heading: 'MOU Covers',
          items: [
            'Roles and responsibilities of each partner',
            'Participant referral and enrollment processes',
            'Data sharing and privacy protocols (FERPA/WIOA compliant)',
            'Outcome reporting requirements and timelines',
            'Duration, renewal, and termination terms',
            'Point of contact and communication protocols',
          ],
        },
        cta: {
          heading: 'Request an MOU',
          subtitle: 'Contact us to discuss partnership terms and receive an MOU template.',
          primaryLabel: 'Contact Us',
          primaryHref: '/contact',
          secondaryLabel: 'Partner Overview',
          secondaryHref: '/partners/apply',
          bgColor: 'bg-slate-900',
        },
      }}
    />
  );
}
