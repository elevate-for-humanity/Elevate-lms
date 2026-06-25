'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

export default function ProgramsHeroVideo() {
  return (
    <CanonicalVideo
      src="/videos/programs-overview-video-with-narration.mp4"
      poster="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/training-cohort.webp"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
