// Audible playback follows the visitor's scroll after the browser grants audio permission.
import type { Metadata } from 'next';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeFunding } from '@/components/home/HomeFunding';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomeBeautyPriority } from '@/components/home/HomeBeautyPriority';
import { HomePlatformOverview } from '@/components/home/HomePlatformOverview';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeNetworks } from '@/components/home/HomeNetworks';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM_DEFAULTS.orgName} | Workforce Training & Apprenticeship Platform`,
  },
  description:
    'One connected workforce platform for career training, registered apprenticeships, employer coordination, credentials, compliance, and participant progress.',
  keywords: [
    'career training Indianapolis',
    'job training Indianapolis',
    'workforce development Indiana',
    'registered apprenticeships Indiana',
    'Indiana workforce training',
    'DOL registered apprenticeship sponsor',
    'Indiana ETPL training provider',
    'career testing and proctoring',
    'workforce funding Indiana',
    'hands-on career training',
    'career credentials',
    'employer workforce development',
    'become a barber apprenticeship host shop',
    'free host shop application Indiana',
    'Indiana barber network',
    'barbershop apprenticeship partner Indiana',
    'cosmetology apprenticeship host salon',
    'nail salon apprenticeship host site',
    'esthetician apprenticeship host spa',
    'beauty salon apprentices Indiana',
    'barber apprentices looking for host shops',
    'host shops Indianapolis Fort Wayne Evansville South Bend',
    'Power Up Indiana training',
    'Indiana employer training reimbursement',
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description:
      'Career training, registered apprenticeships, funding navigation, testing, credentials, employer connections, and workforce technology in one connected platform.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    locale: 'en_US',
    images: [
      {
        url: '/images/pages/comp-home-hero.webp',
        width: 1200,
        height: 630,
        alt: `${PLATFORM_DEFAULTS.orgName} career training and workforce programs`,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description:
      'Explore career training, registered apprenticeships, Host Shops, funding guidance, and employer-connected pathways across Indiana.',
    images: ['/images/pages/comp-home-hero.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <main className="[&_a]:no-underline [&_a:hover]:no-underline">
        <PlatformHubHero />
        <div
          data-scroll-narration
          data-narration-src="/audio/narration/apprenticeship.mp3"
          data-narration="Explore Barber, Cosmetology, Esthetics, and Nail Technician registered apprenticeship pathways. Apprentices combine structured instruction with supervised hands-on training at an approved Host Site."
        >
          <HomeBeautyPriority />
        </div>
        <div
          data-scroll-narration
          data-narration-src="/audio/narration/host-shop.mp3"
          data-narration="Meet featured Host Shops where apprentices build real skills under qualified supervision. Businesses can also apply to become an approved apprenticeship Host Site."
        >
          <HomeFeaturedHostShop />
        </div>
        <div
          data-scroll-narration
          data-narration="Join Elevate's professional networks. The Barber and Beauty Network helps shops and professionals showcase their work and connect with apprentices and customers. Business owners can also explore employer resources and optional business tools in the Elevate Store."
        >
          <HomeNetworks />
        </div>
        <div
          data-scroll-narration
          data-narration-src="/audio/narration/career-pathways.mp3"
          data-narration="Explore career pathways in HVAC, commercial driving, bookkeeping, and business. Training may be available at no cost for people who qualify through an approved workforce funding source."
        >
          <HomeCareerPathways />
        </div>
        <div
          data-scroll-narration
          data-narration="Employers can hire credentialed graduates, become an apprenticeship Host Site, or work with Elevate to design a training cohort around their workforce needs."
        >
          <HomeEmployerStrip />
        </div>
        <div
          data-scroll-narration
          data-narration-src="/audio/narration/funding.mp3"
          data-narration="Not sure how you will pay for training? Start here. Review workforce funding, employer-supported training, grants, and self-pay options. If you are using WorkOne, schedule your official orientation and then complete Elevate's funding intake."
        >
          <HomeFunding />
        </div>
        <div
          data-scroll-narration
          data-narration-src="/audio/narration/website-builder.mp3"
          data-narration="Elevate connects applications, courses, apprenticeships, attendance, credentials, employer workflows, and workforce operations in one coordinated platform."
        >
          <HomePlatformOverview />
        </div>
        <div
          data-scroll-narration
          data-narration-src="/audio/narration/final.mp3"
          data-narration="Ready for your next step? Start an application, check your options, or contact our team for help choosing the right path."
        >
          <HomeFinalCTA />
        </div>
        {/* Keep verification and credential relationships after the conversion journey. */}
        <div data-narration-disabled="true"><HomeTrustBar /></div>
      </main>
    </>
  );
}
