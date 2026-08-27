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
// This asset is part of the canonical shared public bundle. The former
// /videos/voiceover.mp3 path did not exist, so the homepage sound control
// always fell back to a failed audio request.
const HOME_VOICEOVER = '/audio/heroes/home.mp3';
const HOME_FIRST_FRAME = '/images/heroes/hero-home-first-frame.webp';

function withMediaRevision(src?: string) {
  if (!src) return undefined;
  return `${src}${src.includes('?') ? '&' : '?'}v=${HOME_MEDIA_REVISION}`;
}

export default function HomeHeroVideo({ banner }: HomeHeroVideoProps) {
  return (
    <HeroVideo
      videoSrcDesktop={withMediaRevision(banner.videoSrcDesktop)}
      videoSrcMobile={withMediaRevision(banner.videoSrcMobile)}
      mountedFrameImage={HOME_FIRST_FRAME}
      voiceoverSrc={withMediaRevision(banner.voiceoverSrc || HOME_VOICEOVER)}
      transcript={banner.transcript}
      analyticsName={banner.analyticsName}
      overlayMode="none"
      heightClassName="h-[clamp(420px,58vh,720px)]"
      deferVideoMs={0}
    />
  );
}
