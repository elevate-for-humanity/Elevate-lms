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
  it('normalizes owned image imports for optimization and keeps one slide per asset', () => {
    const items = curateShopGallery('shop', [
      { url: 'https://www.elevateforhumanity.org/images/partners/sample.webp' },
      { url: '/images/partners/sample.webp' },
      { url: 'https://elevateforhumanity.org/images/partners/sample.webp?version=2' },
    ]);
    expect(items).toEqual([{ url: '/images/partners/sample.webp' }]);
  });

});

import { shopGalleryForProgram } from '@/lib/partners/curated-shop-media';
it('keeps all three restored Style and Scissor portfolios on nail cards and its general profile', () => {
  const items = ['portfolio-nail-work', 'melissas-nails', 'pink-nail-work'].map(name => ({ url: `/images/partners/style-and-scissor-salon/${name}.webp` }));
  for (const program of ['nail-technician-apprenticeship']) {
    const gallery = shopGalleryForProgram('style-and-scissor-salon', items, program);
    expect(gallery).toHaveLength(3);
    expect(gallery.every(photo => photo.url.endsWith('-restored-2026.webp'))).toBe(true);
    expect(gallery.every(photo => photo.alt?.includes('own photographs'))).toBe(true);
  }
  expect(curateShopGallery('style-and-scissor-salon', items)).toHaveLength(3);
  expect(shopGalleryForProgram('style-and-scissor-salon', items, 'cosmetology-apprenticeship')).toEqual([]);
  expect(shopGalleryForProgram('style-and-scissor-salon', items, 'barber-apprenticeship')).toEqual([]);
  expect(shopGalleryForProgram('style-and-scissor-salon', items, 'unknown', '/logo.webp')).toEqual([]);
});
