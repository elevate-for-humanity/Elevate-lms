// Audible playback follows the visitor's scroll after the browser grants audio permission.
import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeApprenticeshipSales } from '@/components/home/HomeApprenticeshipSales';
import { HomeWebsiteBuilderSales } from '@/components/home/HomeWebsiteBuilderSales';
import { HomeSocialAppCTA } from '@/components/home/HomeSocialAppCTA';
import { HomeFunding } from '@/components/home/HomeFunding';
import { HomePowerUpIndiana } from '@/components/home/HomePowerUpIndiana';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { HomeMobileActions } from '@/components/home/HomeMobileActions';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeAboutElevate } from '@/components/home/HomeAboutElevate';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships in Indianapolis`,
  },
  description:
    'Explore career training, registered apprenticeships, workforce funding pathways, testing, credentials, and employer-connected programs in Indianapolis and across Indiana. Funding eligibility is determined by the responsible agency.',
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
      <main>
        <PlatformHubHero />
        <HomeAboutElevate />
        <HomeHeroVideo banner={heroBanners.home} />
        <div
          data-scroll-narration
          data-narration="An apprenticeship lets you learn with structure while gaining supervised experience on the job. We help connect the classroom, the employer, and your progress records."
          data-narration-src="/audio/narration/apprenticeship.mp3"
        >
          <HomeApprenticeshipSales />
        </div>
        <div
          data-scroll-narration
          data-narration="You do not have to have your whole career figured out today. Start by exploring the field that fits your interests, schedule, and goals."
          data-narration-src="/audio/narration/career-pathways.mp3"
        >
          <HomeCareerPathways />
        </div>
        <div
          data-scroll-narration
          data-narration="If you run a business or training program, Elevate can also help you build your website and manage the tools behind it from one connected place."
          data-narration-src="/audio/narration/website-builder.mp3"
        >
          <HomeWebsiteBuilderSales />
        </div>
        <HomeSocialAppCTA />
        <div
          data-scroll-narration
          data-narration="Indiana employers can explore Power Up Indiana for employer-led training, employee advancement, and possible training reimbursement. Eligibility and reimbursement are determined by the Indiana Department of Workforce Development. Elevate can help employers identify relevant training and organize their next steps."
        >
          <HomePowerUpIndiana />
        </div>
        <div
          data-scroll-narration
          data-narration="Cost should be clear before you enroll. We help you review possible funding and payment paths, then verify what you qualify for."
          data-narration-src="/audio/narration/funding.mp3"
        >
          <HomeFunding />
        </div>
        <div
          data-scroll-narration
          data-narration="When you are ready, choose the next step that fits you: explore a program, apply for training, or connect with our team."
          data-narration-src="/audio/narration/final.mp3"
        >
          <HomeFinalCTA />
        </div>
        <div data-narration-disabled="true">
          <HomeTrustBar />
        </div>
        <HomeMobileActions />
      </main>
    </>
  );
}
