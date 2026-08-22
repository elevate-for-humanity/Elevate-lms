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
    <div className="bg-white">
      <HeroVideo
        videoSrcDesktop={withMediaRevision(banner.videoSrcDesktop)}
        videoSrcMobile={withMediaRevision(banner.videoSrcMobile)}
        posterImage={undefined}
        voiceoverSrc={withMediaRevision(banner.voiceoverSrc)}
        transcript={banner.transcript}
        analyticsName={banner.analyticsName}
        overlayMode="none"
        heightClassName="h-[48vh] min-h-[320px] max-h-[620px] sm:h-[54vh] sm:min-h-[420px] lg:h-[60vh]"
      />

      <section className="border-b border-slate-200 bg-white px-4 py-9 sm:py-12" aria-labelledby="home-value-proposition">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            {banner.microLabel ? (
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700 sm:text-sm">
                {banner.microLabel}
              </p>
            ) : null}
            <h1 id="home-value-proposition" className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {banner.belowHeroHeadline}
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg sm:leading-8">
              {banner.belowHeroSubheadline}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {ctas.map((cta) => (
                <a
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className={
                    cta.variant === 'secondary'
                      ? 'inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-7 py-3.5 text-center text-sm font-black text-slate-950 transition hover:border-slate-500 hover:bg-slate-50'
                      : 'inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3.5 text-center text-sm font-black text-white shadow-sm transition hover:bg-brand-red-700'
                  }
                >
                  {cta.label}
                </a>
              ))}
            </div>
            {trust.length ? (
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {Array.from(new Set(trust)).map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
