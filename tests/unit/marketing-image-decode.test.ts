import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { VERIFIED_IMAGE_ALIASES } from '@/lib/media/verified-image-aliases.mjs';

const damagedPublicImages = [
  '/images/pages/nail-tech-hero.webp',
  '/images/pages/barber-hero-main.jpg',
  '/images/healthcare/video-thumbnail-phlebotomy.jpg',
  '/images/healthcare/video-thumbnail-dental-assistant.jpg',
  '/images/healthcare/program-cna-training.jpg',
  '/images/healthcare/program-medical-assistant.jpg',
  '/images/healthcare/program-healthcare-overview.jpg',
  '/images/trades/hero-program-hvac.jpg',
  '/images/heroes/workforce-partner-5.webp',
  '/images/partners/razors-image-storefront.webp',
  '/images/logo-small.png',
  '/images/logo.jpg',
  '/images/clear-path-main-image.jpg',
  '/images/healthcare/healthcare-professional-portrait-1.jpg',
  '/images/healthcare/healthcare-professional-portrait-2.jpg',
  '/images/icon-72.png',
  '/images/icon-192.png',
  '/images/icon-192x192.png',
];

describe('public image delivery', () => {
  it.each(damagedPublicImages)('provides real decodable pixels for %s', async (url) => {
    const destination = VERIFIED_IMAGE_ALIASES[url];
    expect(destination).toBeTruthy();
    const { data, info } = await sharp(`public${destination}`)
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data.byteLength).toBeGreaterThan(0);
    expect(info.width).toBeGreaterThan(16);
    expect(info.height).toBeGreaterThan(16);
  });
});
