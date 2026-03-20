'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

export default function ProgramsHeroVideo() {
  return (
    <CanonicalVideo
      src="/videos/programs-overview-video-with-narration.mp4"
      poster="/images/pages/training-cohort.jpg"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
