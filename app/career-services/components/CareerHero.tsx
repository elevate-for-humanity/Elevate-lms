'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';
import { VIDEO_HEROES } from '@/lib/hero-config';

export function CareerHero() {
  return (
    <section className="relative h-[clamp(220px,34vw,390px)] overflow-hidden bg-slate-900">
      <CanonicalVideo
        src={VIDEO_HEROES.careerServices}
        poster="/images/pages/career-services-hero.webp"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </section>
  );
}
