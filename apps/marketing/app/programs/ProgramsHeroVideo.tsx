'use client';

import UltraVideoPlayer from '@/components/video/UltraVideoPlayer';

export default function ProgramsHeroVideo() {
  return (
    <UltraVideoPlayer
      src="/videos/programs-overview-video-with-narration.mp4"
      autoPlay
      autoPlayOnMount
      muted
      loop
      showControls={false}
      enableProgressTracking={false}
      enableResume={false}
      aspectRatio="auto"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
