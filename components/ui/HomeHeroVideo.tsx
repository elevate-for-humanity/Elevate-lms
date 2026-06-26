'use client';

import HeroVideo from '@/components/marketing/HeroVideo';
import type { HeroBannerConfig } from '@/content/heroBanners';

interface HomeHeroVideoProps {
  banner: HeroBannerConfig;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  return (
    <>
      <link
        rel="preload"
        as="video"
        href={banner.videoSrcDesktop}
        type="video/mp4"
      />
      <HeroVideo
        videoSrcDesktop={banner.videoSrcDesktop!}
        videoSrcMobile={banner.videoSrcMobile}
        eagerVideoLoad
        compactBelowHero
        voiceoverSrc={banner.voiceoverSrc}
        microLabel={banner.microLabel}
        belowHeroHeadline={banner.belowHeroHeadline}
        belowHeroSubheadline={banner.belowHeroSubheadline}
        ctas={[banner.primaryCta, banner.secondaryCta].filter(Boolean)}
        trustIndicators={banner.trustIndicators}
        transcript={banner.transcript}
      />
    </>
  );
}
