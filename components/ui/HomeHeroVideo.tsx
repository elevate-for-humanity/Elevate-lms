'use client';

import HeroVideo from '@/components/marketing/HeroVideo';

export interface HeroBanner {
  pageKey: string;
  videoSrcDesktop?: string;
  videoSrcMobile?: string;
  posterImage?: string;
  voiceoverSrc?: string;
  microLabel?: string;
  eyebrow?: string;
  belowHeroHeadline: string;
  belowHeroSubheadline: string;
  primaryCta: { label: string; href: string; variant?: 'primary' | 'secondary' };
  secondaryCta?: { label: string; href: string; variant?: 'primary' | 'secondary' };
  trustIndicators?: string[];
  transcript?: string;
  analyticsName: string;
}

export interface HomeHeroVideoProps {
  banner: HeroBanner;
}

const HOME_MEDIA_REVISION = process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 12) || 'home-hero';

function withMediaRevision(src?: string) {
  if (!src) return undefined;
  return `${src}${src.includes('?') ? '&' : '?'}v=${HOME_MEDIA_REVISION}`;
}

/**
 * Homepage video wrapper.
 * Video and narration URLs are revisioned with the deployed commit SHA so
 * browsers, service workers, and intermediary caches cannot pin stale media.
 * Poster artwork remains visible until the video can render and on video failure.
 */
export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const ctas = banner.secondaryCta
    ? [banner.primaryCta, banner.secondaryCta]
    : [banner.primaryCta];

  return (
    <HeroVideo
      videoSrcDesktop={withMediaRevision(banner.videoSrcDesktop)}
      videoSrcMobile={withMediaRevision(banner.videoSrcMobile)}
      posterImage={banner.posterImage}
      voiceoverSrc={withMediaRevision(banner.voiceoverSrc)}
      microLabel={banner.microLabel}
      belowHeroHeadline={banner.belowHeroHeadline}
      belowHeroSubheadline={banner.belowHeroSubheadline}
      ctas={ctas}
      trustIndicators={banner.trustIndicators}
      transcript={banner.transcript}
      analyticsName={banner.analyticsName}
      heightClassName="h-[46vh] min-h-[340px] max-h-[620px]"
    />
  );
}
