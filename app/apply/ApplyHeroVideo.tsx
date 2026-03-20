'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

export default function ApplyHeroVideo() {
  return (
    <CanonicalVideo
      src="/videos/getting-started-hero.mp4"
      poster="/images/pages/apply-hero.jpg"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
