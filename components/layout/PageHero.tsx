import React from 'react';
import Image from 'next/image';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  height?: 'small' | 'medium' | 'large';
}

export default function PageHero({
  title,
  subtitle,
  backgroundImage = '/images/pages/programs-hero-new-2.jpg',
  backgroundVideo,
  height = 'medium',
}: PageHeroProps) {
  const heightClasses = {
    small: 'h-[300px] md:h-[350px]',
    medium: 'h-[400px] md:h-[450px]',
    large: 'h-[500px] md:h-[600px]',
  };

  return (
    <section
      className={`relative ${heightClasses[height]} w-full overflow-hidden bg-brand-blue-900`}
    >
      {/* Background */}
      {backgroundVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={backgroundImage}
          alt={title}
          fill
          priority
          className="object-cover opacity-40 pointer-events-none"
          sizes="100vw"
        />
      )}

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center text-center px-4 pointer-events-none">
        <div className="max-w-4xl w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white uppercase tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
