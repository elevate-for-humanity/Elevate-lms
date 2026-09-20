import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('barber host-shop media governance', () => {
  const showcase = readFileSync(
    resolve(process.cwd(), 'components/programs/beauty/HostShopShowcase.tsx'),
    'utf8',
  );
  const partners = readFileSync(
    resolve(process.cwd(), 'components/programs/beauty/FeaturedHostPartners.tsx'),
    'utf8',
  );
  const barberPage = readFileSync(
    resolve(process.cwd(), 'apps/marketing/app/programs/barber-apprenticeship/page.tsx'),
    'utf8',
  );
  const kountryTour = readFileSync(
    resolve(process.cwd(), 'components/programs/beauty/KountryKutzTourSlideshow.tsx'),
    'utf8',
  );
  const narrator = readFileSync(
    resolve(process.cwd(), 'components/home/ScrollNarrator.tsx'),
    'utf8',
  );

  it('uses the canonical barber hero instead of duplicating the Kountry Kutz tour video', () => {
    expect(barberPage).toContain('videoSrcDesktop={heroBanner.videoSrcDesktop}');
    expect(barberPage).toContain('<KountryKutzTourSlideshow />');
    expect(barberPage).not.toContain('/videos/partners/kountry-kutz/shop-tour.mp4');
  });

  it('presents Kountry Kutz as one accessible photo slideshow', () => {
    expect(kountryTour).toContain('aria-label="Kountry Kutz photo tour"');
    expect(kountryTour).toContain('/images/partners/kountry-kutz/interior-empty.webp');
    expect(kountryTour).toContain('/images/partners/kountry-kutz/interior-active.webp');
    expect(kountryTour).toContain('/images/partners/kountry-kutz-apprenticeship-flyer.webp');
  });

  it('does not publish the low-resolution Razor video on barber surfaces', () => {
    expect(showcase).toContain('/images/partners/razors-image-video-poster.webp');
    expect(showcase).not.toContain('/videos/partners/razors-image-host-barbershop.mp4');
    expect(partners).toContain("shop.slug === 'razors-image-barbershop'");
    expect(partners).toContain('? undefined');
  });

  it('allows only one audible website media source at a time', () => {
    expect(narrator).toContain("document.addEventListener('play', governAudibleMedia, true)");
    expect(narrator).toContain('stopAllNaturalVoicePlayback()');
    expect(narrator).toContain('pauseOtherAudibleMedia(media)');
  });
});
