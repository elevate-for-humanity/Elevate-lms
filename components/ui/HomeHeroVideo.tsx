'use client';

import Image from 'next/image';

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
  const image = banner.posterImage || '/images/heroes/hero-homepage.webp';

  return (
    <section className="border-b border-slate-200 bg-white" aria-labelledby="home-hero-heading">
      <div className="mx-auto grid max-w-screen-2xl lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
        <div className="flex items-center px-5 py-10 sm:px-8 sm:py-14 lg:px-12 xl:px-16">
          <div className="max-w-2xl">
            {banner.microLabel ? (
              <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
                {banner.microLabel}
              </p>
            ) : null}
            <h1 id="home-hero-heading" className="mt-3 text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              {banner.belowHeroHeadline}
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-700">
              {banner.belowHeroSubheadline}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {ctas.map((cta) => (
                <a
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className={
                    cta.variant === 'secondary'
                      ? 'inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-7 py-3.5 text-sm font-black text-slate-950 transition hover:border-slate-500 hover:bg-slate-50'
                      : 'inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-7 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-brand-red-700'
                  }
                >
                  {cta.label}
                </a>
              ))}
            </div>
            {trust.length ? (
              <ul className="mt-7 grid gap-2 sm:grid-cols-2">
                {Array.from(new Set(trust)).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="relative min-h-[320px] sm:min-h-[440px] lg:min-h-[620px]">
          <Image
            src={image}
            alt="Students and professionals preparing for career training and apprenticeship pathways"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}
