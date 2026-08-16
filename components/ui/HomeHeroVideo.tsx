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
    >
      {banner.eyebrow ? (
        <div>
          <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
            {banner.eyebrow}
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            {banner.belowHeroHeadline}
          </h1>
          <p className="mt-5 max-w-3xl text-xl font-medium leading-8 text-slate-800 sm:text-2xl sm:leading-9">
            {banner.belowHeroSubheadline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {ctas.map((cta) => (
              <a
                key={`${cta.href}-${cta.label}`}
                href={cta.href}
                className={
                  cta.variant === 'secondary'
                    ? 'inline-flex min-h-[56px] items-center justify-center rounded-xl border-2 border-slate-400 px-7 py-4 text-lg font-extrabold text-slate-950 transition hover:border-slate-500 hover:bg-slate-50'
                    : 'inline-flex min-h-[56px] items-center justify-center rounded-xl bg-brand-red-600 px-7 py-4 text-lg font-extrabold text-white shadow-sm transition hover:bg-brand-red-700'
                }
              >
                {cta.label}
              </a>
            ))}
          </div>
          {banner.trustIndicators?.length ? (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from(new Set(banner.trustIndicators)).map((indicator) => (
                <li key={indicator} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-950">
                  {indicator}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : undefined}
    </HeroVideo>
  );
}
