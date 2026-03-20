'use client';

import Image from 'next/image';
import Link from 'next/link';
import CanonicalVideo from '@/components/video/CanonicalVideo';

type HeroBannerProps = {
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  trustIndicators?: string[];
  type?: 'image' | 'video';
  videoSrc?: string;
  posterSrc?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
};

export default function HeroBanner({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  trustIndicators = [],
  type = 'image',
  videoSrc = '/videos/homepage-hero-montage.mp4',
  posterSrc = '/images/pages/comp-home-hero-programs.jpg',
  heroImageSrc = '/images/pages/workforce-training.jpg',
  heroImageAlt = 'Elevate for Humanity',
}: HeroBannerProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl">
      <div className="relative h-[50svh] sm:h-[55svh] md:h-[60svh] lg:h-[65svh] min-h-[320px] w-full">
        {type === 'video' ? (
          <CanonicalVideo
            src={videoSrc}
            poster={posterSrc}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image src={heroImageSrc} alt={heroImageAlt} fill priority sizes="100vw" className="object-cover" />
        )}
      </div>
      <div className="bg-white py-10">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg max-w-3xl mx-auto">{subtitle}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {primaryCta && (
                <Link href={primaryCta.href} className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-lg transition-colors text-sm">
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href} className="border border-slate-300 text-slate-700 font-bold px-7 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
          {trustIndicators.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 mt-4">
              {trustIndicators.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <span className="w-1 h-1 rounded-full bg-brand-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
