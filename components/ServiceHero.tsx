import Image from 'next/image';
import Link from 'next/link';

interface ServiceHeroProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export default function ServiceHero({
  title,
  subtitle,
  imageUrl,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
}: ServiceHeroProps) {
  return (
    <section className="relative w-full h-[500px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          priority
         sizes="100vw" />
      </div>
      
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl">
            {subtitle}
          </p>
          
          {(ctaText || secondaryCtaText) && (
            <div className="flex flex-wrap gap-4">
              {ctaText && ctaHref && (
                <Link
                  href={ctaHref}
                  className="px-8 py-4 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
                >
                  {ctaText}
                </Link>
              )}
              {secondaryCtaText && secondaryCtaHref && (
                <Link
                  href={secondaryCtaHref}
                  className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition"
                >
                  {secondaryCtaText}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
