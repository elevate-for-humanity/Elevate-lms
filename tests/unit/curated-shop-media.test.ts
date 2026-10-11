import { describe, expect, it } from 'vitest';
import { curateShopGallery } from '@/lib/partners/curated-shop-media';

describe('shop portfolio curation', () => {
  it('shows each Kountry Kutz photograph once when legacy and enhanced imports overlap', () => {
    const gallery = curateShopGallery('kountry-kutz-barbershop', [
      { url: '/images/partners/kountry-kutz/interior-active.webp' },
      { url: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp' },
      { url: 'https://www.elevateforhumanity.org/images/partners/kountry-kutz/interior-active-enhanced-2026.webp?version=2' },
      { url: '/images/partners/kountry-kutz/interior-empty.webp' },
    ]);
    expect(gallery.map((item) => item.url)).toEqual([
      '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp',
      '/images/partners/kountry-kutz/interior-empty-enhanced-2026.webp',
    ]);
  });
  it('separates Generations before and after and removes repeated images', () => {
    const gallery = curateShopGallery('generations-hair-llc', [
      { url: '/images/partners/generations-hair/color-transformation.webp' },
      { url: '/images/partners/generations-hair/dimensional-color.webp' },
    ]);
    expect(gallery).toHaveLength(2);
    expect(gallery[0].alt).toContain('before');
    expect(gallery[1].alt).toContain('finished');
    expect(gallery[0].url).not.toBe(gallery[1].url);
  });
  it('hides Razor legacy imports without hiding another shop’s portfolio', () => {
    const old = { url: 'https://razorsimage.com/wp-content/uploads/2020/10/6.jpg' };
    const logo = { url: '/images/partners/razors-image-logo.jpg' };
    expect(curateShopGallery('razors-image-barbershop', [old, logo])).toEqual([logo]);
    expect(curateShopGallery('other-shop', [old])).toEqual([old]);
  });
});
