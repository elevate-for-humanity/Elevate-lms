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
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeAboutElevate } from '@/components/home/HomeAboutElevate';
import { HomeProgramShowcase } from '@/components/home/HomeProgramShowcase';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';

const HOME_HOST_SHOP_ORDER = [
  'salon-saloon',
  'kountry-kutz-barbershop',
  'cals-kutz-studio',
  'b-52s-barber-shop',
  'generations-hair-llc',
] as const;

const HOME_HOST_SHOPS = HOME_HOST_SHOP_ORDER.flatMap((slug) => {
  const shop = FEATURED_BEAUTY_HOST_PARTNERS.find((candidate) => candidate.slug === slug);
  return shop ? [shop] : [];
});

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
          data-narration="Explore Elevate career programs built for real employment opportunities. Train for HVAC and skilled trades, commercial driving, business and entrepreneurship, bookkeeping and finance, information technology, healthcare, and other in-demand fields. Many programs may be free to participants who qualify for workforce funding. Funding is not automatic: the responsible agency must approve the participant, program, and covered costs in writing. If funding is not approved, admissions can explain available self-pay and payment options. Enrollment is open, upcoming cohorts are forming, and PARIS can guide you through program selection, funding steps, the application, required documents, and what to do next."
          data-narration-src="/audio/heroes/home.mp3"
        >
          <HomeProgramShowcase />
        </div>
        <div
          data-scroll-narration
          data-narration="An apprenticeship lets you learn with structure while gaining supervised experience on the job. We help connect the classroom, the employer, and your progress records."
          data-narration-src="/audio/narration/apprenticeship.mp3"
        >
          <HomeApprenticeshipSales />
        </div>
        <HostShopShowcase
          shops={HOME_HOST_SHOPS}
          videoTourShopSlug="salon-saloon"
          autoPlayVideoOnVisible
          mediaSequence={[
            {
              shopSlug: 'salon-saloon',
              media: {
                src: '/videos/partners/salon-saloon-tour.mp4',
                alt: 'Walk-through tour of participating apprenticeship Host Shop Salon Saloon',
                kind: 'video',
                backdropSrc: '/images/partners/salon-saloon/team-sign.webp',
              },
            },
            {
              shopSlug: 'salon-saloon',
              media: {
                src: '/images/partners/salon-saloon/team-sign.webp',
                alt: 'Salon Saloon team at an Elevate participating Host Salon',
                kind: 'photo',
              },
            },
            {
              shopSlug: 'kountry-kutz-barbershop',
              media: {
                src: '/images/partners/kountry-kutz-interior.webp',
                alt: 'Interior of Kountry Kutz apprenticeship host barbershop',
                kind: 'photo',
              },
            },
            {
              shopSlug: 'kountry-kutz-barbershop',
              media: {
                src: '/videos/partners/kountry-kutz-tour.mp4',
                alt: 'Video introduction and tour of Kountry Kutz apprenticeship host barbershop',
                kind: 'video',
                backdropSrc: '/images/partners/kountry-kutz-official.webp',
              },
            },
            {
              shopSlug: 'cals-kutz-studio',
              media: {
                src: '/images/partners/cals-kutz-official.webp',
                alt: 'Cals Kutz Studio apprenticeship host barbershop',
                kind: 'photo',
              },
            },
            {
              shopSlug: 'b-52s-barber-shop',
              media: {
                src: '/images/partners/b52s-official.webp',
                alt: "B-52's Barbershop in New Castle",
                kind: 'photo',
              },
            },
          ]}
          narrationSrc="/audio/narration/host-shop.mp3"
          tourScripts={{
            '/videos/partners/salon-saloon-tour.mp4':
              'Welcome to Salon Saloon in South Bend, Indiana. This participating Elevate Host Salon gives cosmetology apprentices a professional setting for supervised workplace learning. As you tour the salon, notice the service stations, client-ready environment, sanitation practices, and team workflow. Apprentices connect classroom instruction with documented on-the-job experience while learning technical skills, client service, safety, and professional expectations. Select Schedule a Host Shop Walk-Through to learn more.',
            '/videos/partners/kountry-kutz-tour.mp4':
              'Welcome to Kountry Kutz Barbershop in New Palestine, Indiana. This tour introduces a participating apprenticeship Host Shop where barber apprentices can build skills through structured instruction and supervised workplace experience. Notice the active service floor, professional stations, client interaction, shop routines, and safety practices. Use the shop details beside the video to explore the location or schedule a Host Shop walk-through.',
          }}
          narration="Welcome to the Salon Saloon tour in South Bend, Indiana. Salon Saloon is a participating Elevate Host Salon where cosmetology apprentices connect classroom instruction with supervised experience inside a working salon. During apprenticeship, the employer teaches professional routines, client service, safety, sanitation, technical skills, and workplace expectations while documenting the apprentice's progress. Host Shops may use hourly pay, commission, or a combination, but the apprentice's weekly earnings must equal at least the applicable required wage for every compensable hour, with a wage top-up when commission falls short. Continue through the gallery to meet other participating shops, view their locations and contact information, and schedule a Host Shop walk-through."
        />
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
