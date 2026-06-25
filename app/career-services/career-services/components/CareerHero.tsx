'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';
import { VIDEO_HEROES } from '@/lib/hero-config';

export function CareerHero() {
  return (
    <section className="relative h-[60svh] min-h-[380px] max-h-[640px] overflow-hidden bg-slate-900">
      <CanonicalVideo
        src={VIDEO_HEROES.careerServices}
        poster="/images/pages/career-services-hero.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </section>
  );
}
