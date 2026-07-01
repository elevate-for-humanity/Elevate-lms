import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function HomeTopHero() {
  return (
    <section className="relative w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
      <Image
        src="/images/pages/prog-hero-main-2.webp"
        alt={`${PLATFORM_DEFAULTS.orgName} - Empowering Futures Through Innovation & Opportunity`}
        width={1920}
        height={800}
        priority
        className="h-[220px] sm:h-[280px] md:h-[320px] lg:h-[380px] max-h-[420px] w-full object-cover"
        sizes="(max-width: 768px) 100vw, 1200px"
        quality={75}
        placeholder="empty"
      />
      {/* Overlay content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 leading-tight">
            Elevate For Humanity
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl">
            Empowering Futures Through Innovation & Opportunity
          </p>
        </div>
      </div>
    </section>
  );
}
