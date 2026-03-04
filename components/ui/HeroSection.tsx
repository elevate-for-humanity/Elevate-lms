import Image from 'next/image';
import Link from 'next/link';

/**
 * Hero Section Component
 * 
 * Three variants, zero gradients:
 * - full: Full-bleed image, text on solid panel
 * - split: Left content, right image (default)
 * - illustration: Vector/diagram hero for system pages
 * 
 * Rules:
 * 1. NO gradient overlays - ever
 * 2. Text always on solid panel, never floating on image
 * 3. Every page must have a hero
 * 4. data-hero attribute for audit/scan tooling
 * 
 * Usage:
 * <HeroSection
 *   title="Program Title"
 *   subtitle="Brief description"
 *   image="/images/pages/comp-highlights-success.jpg"
 *   variant="split"
 *   ctaPrimary={{ label: "Apply Now", href: "/apply" }}
 * />
 */

export type HeroVariant = 'full' | 'split' | 'illustration' | 'video';
export type HeroHeight = 'full' | 'medium' | 'compact';

export interface HeroCTA {
  label: string;
  href: string;
}

export interface HeroSectionProps {
  title: string;
  subtitle?: string;
  /** Image source - required for full/split variants */
  image?: string;
  imageAlt?: string;
  /** Video source - required for video variant */
  videoSrc?: string;
  /** Poster image for video (required for video variant) */
  videoPoster?: string;
  variant?: HeroVariant;
  height?: HeroHeight;
  ctaPrimary?: HeroCTA;
  ctaSecondary?: HeroCTA;
  /** Optional badge/tag above title */
  badge?: string;
  /** Optional metadata items (duration, cost, etc.) */
  metadata?: Array<{ label: string; value: string }>;
  /** Background color for content panel (split/full variants) */
  panelColor?: 'white' | 'slate' | 'dark';
}

const heightClasses: Record<HeroHeight, string> = {
  full: 'min-h-[70vh]',
  medium: 'min-h-[50vh]',
  compact: 'min-h-[35vh]',
};

const panelColors: Record<string, { bg: string; text: string; muted: string }> = {
  white: { bg: 'bg-white', text: 'text-gray-900', muted: 'text-gray-600' },
  slate: { bg: 'bg-slate-50', text: 'text-gray-900', muted: 'text-gray-600' },
  dark: { bg: 'bg-slate-900', text: 'text-white', muted: 'text-slate-300' },
};

export function HeroSection({
  title,
  subtitle,
  image,
  imageAlt,
  videoSrc,
  videoPoster,
  variant = 'split',
  height = 'medium',
  ctaPrimary,
  ctaSecondary,
  badge,
  metadata,
  panelColor = 'white',
}: HeroSectionProps) {
  const colors = panelColors[panelColor];

  // VARIANT: VIDEO - Video background with solid content panel
  // Rules: No gradient overlays, text in solid container, calm motion only
  if (variant === 'video') {
    return (
      <section data-hero="true" data-hero-variant="video" className={`relative ${heightClasses[height]} flex items-end overflow-hidden`}>
        {/* Video background - NO overlay, NO gradient */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={videoPoster}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        
        {/* Content panel - solid background, positioned bottom-left */}
        <div className="relative z-10 w-full">
          <div className={`${colors.bg} max-w-2xl mx-4 md:mx-8 lg:mx-16 mb-8 p-8 rounded-t-2xl shadow-lg`}>
            {badge && (
              <span className="inline-block px-3 py-1 bg-brand-blue-600 text-white text-sm font-medium rounded-full mb-4">
                {badge}
              </span>
            )}
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${colors.text} mb-4`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-lg ${colors.muted} mb-6`}>
                {subtitle}
              </p>
            )}
            {(ctaPrimary || ctaSecondary) && (
              <div className="flex flex-wrap gap-4">
                {ctaPrimary && (
                  <Link
                    href={ctaPrimary.href}
                    className="inline-flex items-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                  >
                    {ctaPrimary.label}
                  </Link>
                )}
                {ctaSecondary && (
                  <Link
                    href={ctaSecondary.href}
                    className={`inline-flex items-center px-6 py-3 border-2 border-current font-semibold rounded-lg hover:bg-gray-100 transition ${colors.text}`}
                  >
                    {ctaSecondary.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // VARIANT: FULL - Full-bleed image with solid content panel
  if (variant === 'full') {
    return (
      <section data-hero="true" data-hero-variant="full" className={`relative ${heightClasses[height]} flex items-end`}>
        {/* Full-bleed image - NO overlay */}
        <Image
          src={image}
          alt={imageAlt || title}
          fill
          className="object-cover"
          priority
        />
        
        {/* Content panel - solid background, no gradient */}
        <div className="relative z-10 w-full">
          <div className={`${colors.bg} max-w-3xl mx-4 md:mx-8 lg:mx-16 mb-8 p-8 rounded-t-2xl`}>
            {badge && (
              <span className="inline-block px-3 py-1 bg-brand-blue-600 text-white text-sm font-medium rounded-full mb-4">
                {badge}
              </span>
            )}
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${colors.text} mb-4`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-lg ${colors.muted} mb-6`}>
                {subtitle}
              </p>
            )}
            {(ctaPrimary || ctaSecondary) && (
              <div className="flex flex-wrap gap-4">
                {ctaPrimary && (
                  <Link
                    href={ctaPrimary.href}
                    className="inline-flex items-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                  >
                    {ctaPrimary.label}
                  </Link>
                )}
                {ctaSecondary && (
                  <Link
                    href={ctaSecondary.href}
                    className={`inline-flex items-center px-6 py-3 border-2 border-current font-semibold rounded-lg hover:bg-gray-100 transition ${colors.text}`}
                  >
                    {ctaSecondary.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // VARIANT: ILLUSTRATION - For system/process pages
  if (variant === 'illustration') {
    return (
      <section data-hero="true" data-hero-variant="illustration" className={`${colors.bg} ${heightClasses[height]} flex items-center`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              {badge && (
                <span className="inline-block px-3 py-1 bg-brand-blue-100 text-brand-blue-700 text-sm font-medium rounded-full mb-4">
                  {badge}
                </span>
              )}
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${colors.text} mb-4`}>
                {title}
              </h1>
              {subtitle && (
                <p className={`text-lg ${colors.muted} mb-6`}>
                  {subtitle}
                </p>
              )}
              {metadata && metadata.length > 0 && (
                <div className="flex flex-wrap gap-6 mb-6">
                  {metadata.map((item, idx) => (
                    <div key={idx}>
                      <p className={`text-sm ${colors.muted}`}>{item.label}</p>
                      <p className={`font-semibold ${colors.text}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {(ctaPrimary || ctaSecondary) && (
                <div className="flex flex-wrap gap-4">
                  {ctaPrimary && (
                    <Link
                      href={ctaPrimary.href}
                      className="inline-flex items-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                    >
                      {ctaPrimary.label}
                    </Link>
                  )}
                  {ctaSecondary && (
                    <Link
                      href={ctaSecondary.href}
                      className="inline-flex items-center px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50 transition"
                    >
                      {ctaSecondary.label}
                    </Link>
                  )}
                </div>
              )}
            </div>
            
            {/* Illustration/Diagram - NO overlay */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={image}
                alt={imageAlt || title}
                fill
                className="object-contain p-4"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // VARIANT: SPLIT (default) - Left content, right image
  return (
    <section data-hero="true" data-hero-variant="split" className={`${heightClasses[height]} flex items-stretch`}>
      <div className="grid lg:grid-cols-2 w-full">
        {/* Content panel - solid background */}
        <div className={`${colors.bg} flex items-center`}>
          <div className="max-w-xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
            {badge && (
              <span className="inline-block px-3 py-1 bg-brand-blue-600 text-white text-sm font-medium rounded-full mb-4">
                {badge}
              </span>
            )}
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${colors.text} mb-4`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-lg ${colors.muted} mb-6`}>
                {subtitle}
              </p>
            )}
            {metadata && metadata.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                {metadata.map((item, idx) => (
                  <div key={idx}>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
            {(ctaPrimary || ctaSecondary) && (
              <div className="flex flex-wrap gap-4">
                {ctaPrimary && (
                  <Link
                    href={ctaPrimary.href}
                    className="inline-flex items-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                  >
                    {ctaPrimary.label}
                  </Link>
                )}
                {ctaSecondary && (
                  <Link
                    href={ctaSecondary.href}
                    className="inline-flex items-center px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50 transition"
                  >
                    {ctaSecondary.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Image panel - NO overlay, clean edge */}
        <div className="relative hidden lg:block">
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
      
      {/* Mobile image - shown below content on small screens */}
      <div className="relative aspect-video lg:hidden">
        <Image
          src={image}
          alt={imageAlt || title}
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
}

export default HeroSection;
