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
const HOME_VOICEOVER = '/videos/voiceover.mp3';

function withMediaRevision(src?: string) {
  if (!src) return undefined;
  return `${src}${src.includes('?') ? '&' : '?'}v=${HOME_MEDIA_REVISION}`;
}

function publicTrustIndicators(items?: string[]) {
  return items?.map((item) =>
    item === 'Blockchain-Verified Credentials' ? 'Credential Verification Workflows' : item,
  );
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  const trust = publicTrustIndicators(banner.trustIndicators) || [];
  const ctas = banner.secondaryCta
    ? [banner.primaryCta, banner.secondaryCta]
    : [banner.primaryCta];

  return (
    <HeroVideo
      videoSrcDesktop={withMediaRevision(banner.videoSrcDesktop)}
      videoSrcMobile={withMediaRevision(banner.videoSrcMobile)}
      posterImage={banner.posterImage}
      voiceoverSrc={withMediaRevision(banner.voiceoverSrc || HOME_VOICEOVER)}
      transcript={banner.transcript}
      analyticsName={banner.analyticsName}
      microLabel={banner.microLabel}
      belowHeroHeadline={banner.belowHeroHeadline}
      belowHeroSubheadline={banner.belowHeroSubheadline}
      ctas={ctas}
      trustIndicators={trust}
      overlayMode="none"
      heightClassName="h-[52vh] min-h-[360px] max-h-[680px] md:h-[58vh] md:min-h-[480px] lg:h-[62vh]"
    />
  );
}
