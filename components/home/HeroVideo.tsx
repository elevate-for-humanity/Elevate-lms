'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

type HeroVideoProps = {
  src: string;
  poster?: string;
  className?: string;
};

export default function HeroVideo({ src, poster = '/images/og-default.jpg', className }: HeroVideoProps) {
  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <CanonicalVideo
        src={src}
        poster={poster}
        className="w-full rounded-2xl shadow-sm border border-zinc-200 bg-black"
      />
    </div>
  );
}
