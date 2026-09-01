import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeApprenticeshipSales } from '@/components/home/HomeApprenticeshipSales';
import { HomeWebsiteBuilderSales } from '@/components/home/HomeWebsiteBuilderSales';
import { HomeSocialAppCTA } from '@/components/home/HomeSocialAppCTA';
import { HomeFunding } from '@/components/home/HomeFunding';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { HomeMobileActions } from '@/components/home/HomeMobileActions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';

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
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description:
      'Career training, registered apprenticeships, funding navigation, testing, credentials, employer connections, and workforce technology in one connected platform.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
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
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <main>
        <HomeHeroVideo banner={heroBanners.home} />
        <div data-scroll-narration data-narration="Take a look inside our host-shop network. These are working businesses where apprentices can build skills with approved supervision and real customers.">
          <HostShopShowcase shops={FEATURED_BEAUTY_HOST_PARTNERS} />
        </div>
        <div data-scroll-narration data-narration="You do not have to have your whole career figured out today. Start by exploring the field that fits your interests, schedule, and goals.">
          <HomeCareerPathways />
        </div>
        <div data-scroll-narration data-narration="An apprenticeship lets you learn with structure while gaining supervised experience on the job. We help connect the classroom, the employer, and your progress records.">
          <HomeApprenticeshipSales />
        </div>
        <div data-scroll-narration data-narration="If you run a business or training program, Elevate can also help you build your website and manage the tools behind it from one connected place.">
          <HomeWebsiteBuilderSales />
        </div>
        <div data-scroll-narration data-narration="Stay connected with opportunities, updates, and your Elevate community wherever you are.">
          <HomeSocialAppCTA />
        </div>
        <div data-scroll-narration data-narration="Cost should be clear before you enroll. We help you review possible funding and payment paths, then verify what you qualify for.">
          <HomeFunding />
        </div>
        <div data-scroll-narration data-narration="When you are ready, choose the next step that fits you: explore a program, apply for training, or connect with our team.">
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
