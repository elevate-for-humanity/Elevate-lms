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
      <div className="relative h-[200px] md:h-[260px]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/35 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-3xl px-8 md:px-12">
            {eyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-blue-300 mb-2">
                {eyebrow}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">
              {title}
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-xl mb-4">
              {subtitle}
            </p>
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition border border-white/20"
                  >
                    {secondaryCta.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
