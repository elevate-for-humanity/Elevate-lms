import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function HomeSecondHero() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-5xl px-4">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image sizes="100vw"
          src="/images/pages/programs-hero-vibrant.webp"
          alt={`${PLATFORM_DEFAULTS.orgName} - Career & Technical Training, Hybrid Apprenticeships, Certifications & Digital Badges, Entrepreneurship & Workforce Startup`}
          width={1920}
          height={1080}
          className="w-full rounded-2xl shadow-lg" placeholder="empty"
        />
      </div>
    </section>
  );
}
