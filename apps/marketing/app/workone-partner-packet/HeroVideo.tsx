import HeroVideo from '@/components/marketing/HeroVideo';

/**
 * WorkOne packet hero wrapper.
 * Rendering behavior is owned by the canonical Marketing HeroVideo component.
 */
export default function WorkOneHeroVideo() {
  return (
    <HeroVideo
      posterImage="/images/pages/workone-partner-packet-page-1.webp"
      microLabel="WorkOne Partner Packet"
      analyticsName="workone-partner-packet"
      heightClassName="h-[clamp(420px,58vh,720px)]"
    />
  );
}
