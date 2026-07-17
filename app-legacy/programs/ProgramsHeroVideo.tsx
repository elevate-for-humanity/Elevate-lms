'use client';

import UltraVideoPlayer from '@/components/video/UltraVideoPlayer';

export default function ProgramsHeroVideo() {
  return (
    <UltraVideoPlayer
      src="/videos/programs-overview-video-with-narration.mp4"
      poster="/images/pages/training-cohort.webp"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
