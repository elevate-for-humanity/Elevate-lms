'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

export function CareerHero() {
  return (
    <section className="relative h-[60svh] min-h-[380px] max-h-[640px] overflow-hidden bg-slate-900">
      <CanonicalVideo
        src="/videos/career-services-hero.mp4"
        poster="/images/pages/career-services-hero.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </section>
  );
}
