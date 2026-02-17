'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getHeroImage, isVideoHero, shouldPrioritizeHero } from '@/lib/hero-config';

interface PageHeroProps {
  title?: string;
  description?: string;
  forceHero?: string; // Override for specific pages
}

export default function PageHero({ title, description, forceHero }: PageHeroProps) {
  const pathname = usePathname();
  const heroSrc = forceHero ?? getHeroImage(pathname);

  // No hero for this page
  if (!heroSrc) {
    return title ? (
      <div className="bg-gradient-to-r from-brand-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          {description && <p className="text-xl text-brand-blue-100">{description}</p>}
        </div>
      </div>
    ) : null;
  }

  const isVideo = isVideoHero(heroSrc);
  const priority = shouldPrioritizeHero(pathname);

  return (
    <section className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
      {isVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroSrc} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={heroSrc}
          alt={title || 'Hero'}
          fill
          className="object-cover"
          quality={100}
          priority={priority}
          unoptimized
        />
      )}

      {title && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{title}</h1>
            {description && (
              <p className="text-xl text-white/90">{description}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
