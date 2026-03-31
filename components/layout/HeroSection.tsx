import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaPrimary?: {
    text: string;
    href: string;
  };
  ctaSecondary?: {
    text: string;
    href: string;
  };
  image?: string;
  imageAlt?: string;
  stats?: Array<{
    value: string;
    label: string;
  }>;
  badge?: string;
}

export function HeroSection({
  title,
  subtitle,
  description,
  ctaPrimary,
  ctaSecondary,
  image,
  imageAlt = "Hero image",
  stats,
  badge,
}: HeroSectionProps) {
  return (
    <section className="relative     text-white overflow-hidden">
      {/* Background Image */}
      {image && (
        <div className="absolute inset-0 opacity-30">
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
            quality={100}
           sizes="100vw" />
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl">
          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold mb-6 shadow-lg">
              <span>{badge}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-2xl md:text-3xl text-slate-200 font-light mb-6">
              {subtitle}
            </p>
          )}

          {/* Description */}
          {description && (
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
              {description}
            </p>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mb-8 max-w-2xl">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-brand-orange-400">{stat.value}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          {(ctaPrimary || ctaSecondary) && (
            <div className="flex flex-col sm:flex-row gap-4">
              {ctaPrimary && (
                <Link
                  href={ctaPrimary.href}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-orange-500 text-white font-semibold rounded-lg hover:bg-brand-orange-600 transition-all hover:scale-105 shadow-lg text-lg"
                >
                  {ctaPrimary.text}
                  <ArrowRight size={20} />
                </Link>
              )}
              {ctaSecondary && (
                <Link
                  href={ctaSecondary.href}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-slate-50 transition-all hover:scale-105 shadow-lg text-lg"
                >
                  {ctaSecondary.text}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
