'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

type Props = {
  posterImage?: string;
  videoSrc?: string;
};

export default function HeroMedia({ posterImage, videoSrc }: Props) {
  const poster = posterImage || '/images/og-default.jpg';

  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      {videoSrc ? (
        <CanonicalVideo
          src={videoSrc}
          poster={poster}
          className="h-[420px] w-full object-cover md:h-[520px]"
        />
      ) : (
        <div
          className="h-[420px] w-full md:h-[520px] bg-cover bg-center"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}
    </div>
  );
}
