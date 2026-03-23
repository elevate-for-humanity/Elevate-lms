'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

export type HeroSize = 'primary' | 'program' | 'marketing' | 'support';

const SIZE: Record<HeroSize, string> = {
  primary:   'h-[75vh] min-h-[480px] max-h-[860px]',
  program:   'h-[65vh] min-h-[420px] max-h-[720px]',
  marketing: 'h-[60vh] min-h-[380px] max-h-[640px]',
  support:   'h-[50vh] min-h-[300px] max-h-[520px]',
};

interface PageVideoHeroProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt: string;
  size?: HeroSize;
}

export default function PageVideoHero({ videoSrc, posterSrc, size = 'marketing' }: PageVideoHeroProps) {
  return (
    <section className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <CanonicalVideo
        src={videoSrc}
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </section>
  );
}
