'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

interface VideoHeroProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt: string;
  heightClass?: string;
}

export default function VideoHero({
  videoSrc,
  posterSrc,
  heightClass = 'h-[50vh] md:h-[60vh]',
}: VideoHeroProps) {
  return (
    <div className={`relative w-full overflow-hidden ${heightClass}`}>
      <CanonicalVideo
        src={videoSrc}
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
