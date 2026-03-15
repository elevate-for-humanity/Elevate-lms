import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface ModernLandingHeroProps {
  badge?: string;
  headline: string;
  accentText?: string;
  subheadline: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  features?: string[];
  imageOnRight?: boolean;
}

export default function ModernLandingHero({
  badge,
  headline,
  accentText,
  subheadline,
  description,
  imageSrc,
  imageAlt,
  primaryCTA,
  secondaryCTA,
  features = [],
  imageOnRight = true,
}: ModernLandingHeroProps) {
  const contentSection = (
    <div className="flex flex-col justify-center">
      {badge && (
        <div className="inline-flex items-center gap-2 bg-brand-blue-50 text-brand-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 w-fit">
          <span className="w-2 h-2 bg-brand-blue-500 rounded-full"></span>
          {badge}
        </div>
      )}
      
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-4 leading-tight">
        {headline}
        {accentText && (
          <span className="block text-brand-blue-600">{accentText}</span>
        )}
      </h1>
      
      <h2 className="text-xl md:text-2xl text-black font-semibold mb-6">
        {subheadline}
      </h2>
      
      <p className="text-lg text-black mb-8 leading-relaxed">
        {description}
      </p>

      {features.length > 0 && (
        <div className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <span className="text-black">{feature}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href={primaryCTA.href}
          className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          {primaryCTA.text}
          <ArrowRight className="w-5 h-5" />
        </Link>
        
        {secondaryCTA && (
          <Link
            href={secondaryCTA.href}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-gray-200"
          >
            {secondaryCTA.text}
          </Link>
        )}
      </div>
    </div>
  );

  const webpSrc = imageSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  const imageSection = (
    <div className="relative h-[300px] md:h-[350px] lg:h-[400px] rounded-2xl overflow-hidden shadow-2xl">
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
          quality={85}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </picture>
    </div>
  );

  return (
    <section className="bg-gradient-to-br from-gray-50 to-white pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {imageOnRight ? (
            <>
              {contentSection}
              {imageSection}
            </>
          ) : (
            <>
              {imageSection}
              {contentSection}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
