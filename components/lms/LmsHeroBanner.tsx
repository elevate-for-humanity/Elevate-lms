import { IMAGE_LOADING_BLUR } from '@/lib/ui/blur-placeholder';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface LmsHeroBannerProps {
  title: string;
  subtitle: string;
  image: string;
  /** Primary CTA button */
  cta?: { label: string; href: string };
  /** Secondary CTA button */
  secondaryCta?: { label: string; href: string };
  /** Small label above the title */
  eyebrow?: string;
}

export function LmsHeroBanner({
  title,
  subtitle,
  image,
  cta,
  secondaryCta,
  eyebrow,
}: LmsHeroBannerProps) {
  return (
    <section className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
      <div className="relative aspect-video">
        <Image
          placeholder="blur"
          blurDataURL={IMAGE_LOADING_BLUR}
          src={image}
          alt={title}
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
        />
      </div>
      <div className="bg-slate-950 py-6 sm:py-8">
        <div className="max-w-3xl px-8 md:px-12">
          {eyebrow && (
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-blue-300 mb-2">
              {eyebrow}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">
            {title}
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-xl mb-4">{subtitle}</p>
          {(cta || secondaryCta) && (
            <div className="flex flex-wrap gap-3">
              {cta && (
                <Link
                  href={cta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg transition shadow-lg"
                >
                  {cta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-lg transition border border-white/20"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
