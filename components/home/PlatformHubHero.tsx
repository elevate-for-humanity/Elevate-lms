import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

const HOME_VIDEO =
  'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4';

export function PlatformHubHero() {
  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950"
      aria-label="Elevate for Humanity career training and apprenticeship hero"
      data-scroll-narration
      data-narration="Welcome to Elevate for Humanity. Explore career training and apprenticeships, find a program that fits your goals, and learn how to get started."
      data-narration-style="instructor"
    >
      <div className="relative aspect-video w-full max-h-[560px] min-h-0 bg-slate-950 sm:aspect-[16/8] lg:h-[clamp(420px,52svh,560px)] lg:aspect-auto">
        <SafeHeroVideo
          src={HOME_VIDEO}
          poster="/images/pages/hero-home-first-frame.webp"
          priority
          loop
          ariaLabel="Elevate for Humanity career training, apprenticeship, and workforce programs"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    </section>
  );
}
