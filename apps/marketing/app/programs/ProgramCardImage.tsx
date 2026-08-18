'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

const DEFAULT_FALLBACK = '/images/programs-hero-vibrant.webp';

const CATEGORY_FALLBACKS: Record<string, string> = {
  'Business & Financial': '/images/business/team-2.jpg',
  Healthcare: '/images/pages/healthcare-sector.webp',
  'Skilled Trades': '/images/pages/construction-trades.webp',
  Technology: '/images/pages/technology-sector.webp',
  'Barber & Beauty': '/images/pages/cosmetology.webp',
  'Human Services': '/images/pages/community-page-3.webp',
  Hospitality: '/images/pages/community-page-10.webp',
};

type ProgramCardImageProps = {
  src: string;
  alt: string;
  category: string;
};

export default function ProgramCardImage({ src, alt, category }: ProgramCardImageProps) {
  const categoryFallback = useMemo(
    () => CATEGORY_FALLBACKS[category] ?? DEFAULT_FALLBACK,
    [category],
  );
  const [currentSrc, setCurrentSrc] = useState(src || categoryFallback);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className="object-cover transition duration-500 group-hover:scale-105"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={() => {
        if (currentSrc !== categoryFallback) {
          setCurrentSrc(categoryFallback);
          return;
        }
        if (currentSrc !== DEFAULT_FALLBACK) setCurrentSrc(DEFAULT_FALLBACK);
      }}
    />
  );
}
