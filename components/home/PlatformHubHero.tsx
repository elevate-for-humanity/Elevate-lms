import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

const HOME_VIDEO =
  'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4';

export function PlatformHubHero() {
  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950"
      aria-label="Elevate for Humanity career training and apprenticeship hero"
    >
      <div className="relative h-[clamp(420px,68svh,760px)] w-full">
        <SafeHeroVideo
          src={HOME_VIDEO}
          poster="/images/pages/comp-home-hero.webp"
          showPosterBeforePlayback
          priority
          loop
          ariaLabel="Elevate for Humanity career training, apprenticeship, and workforce programs"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    </section>
  );
}
