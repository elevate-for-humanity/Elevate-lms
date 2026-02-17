import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface CompactHeroProps {
  eyebrow?: string;
  badge?: {
    icon: LucideIcon;
    text: string;
    href: string;
  };
  headline: string;
  subheadline?: string;
  description?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  variant?: 'default' | 'muted' | 'gradient';
}

export function CompactHero({
  eyebrow,
  badge,
  headline,
  subheadline,
  description,
  primaryCTA,
  secondaryCTA,
  variant = 'default',
}: CompactHeroProps) {
  const backgrounds = {
    default: 'bg-white',
    muted: 'bg-gray-50',
    gradient: 'bg-gradient-to-b from-brand-blue-50 to-white',
  };

  return (
    <section className={backgrounds[variant]}>
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        {eyebrow && (
          <p className="mb-3 text-sm font-medium text-black uppercase tracking-wide">
            {eyebrow}
          </p>
        )}

        {badge && (
          <Link
            href={badge.href}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 mb-3"
          >
            <badge.icon className="w-4 h-4" />
            {badge.text}
          </Link>
        )}

        <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl text-black">
          {headline}
        </h1>

        <p className="mt-4 max-w-2xl text-base md:text-lg text-black leading-relaxed">
          {description || subheadline}
        </p>

        {(primaryCTA || secondaryCTA) && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {primaryCTA && (
              <Link
                href={primaryCTA.href}
                className="inline-flex items-center justify-center rounded-lg bg-brand-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-blue-700 transition-colors"
              >
                {primaryCTA.text}
              </Link>
            )}
            {secondaryCTA && (
              <Link
                href={secondaryCTA.href}
                className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-6 py-3 text-base font-semibold text-black hover:bg-gray-50 transition-colors"
              >
                {secondaryCTA.text}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
