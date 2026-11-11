import { describe, expect, it } from 'vitest';
import { curateShopGallery } from '../../lib/partners/curated-shop-media';

describe('verified locally bundled shop photography', () => {
  it('deduplicates GitHub and local copies of an Executivecutz photo', () => {
    const local = '/images/host-shops/executivecutz/interior-1.webp';
    const raw = 'https://raw.githubusercontent.com/elevate-for-humanity/Elevate-lms/1c69e4586c319c27ad0ab770c7a5c9862bbea97a/public' + local;
    expect(curateShopGallery('executivecutz', [{ url: raw }, { url: local }])).toEqual([{ url: local }]);
  });
  it('does not rewrite another repository or an unverified asset', () => {
    const url = 'https://raw.githubusercontent.com/other/repo/main/public/images/host-shops/executivecutz/interior-1.webp';
    expect(curateShopGallery('executivecutz', [{ url }])).toEqual([{ url }]);
  });
});

it('leads Style and Scissor with its restored manicure instead of a logo or album sheet', () => {
  const photos = curateShopGallery('style-and-scissor-salon', [
    { url: '/images/partners/style-and-scissor-salon/logo.webp' },
    { url: '/images/partners/style-and-scissor-salon/portfolio-nail-work.webp' },
    { url: '/images/partners/style-and-scissor-salon/contact-card.webp' },
  ]);
  expect(photos).toHaveLength(1);
  expect(photos[0].url).toBe('/images/partners/style-and-scissor-salon/manicure-enhanced-2026.webp');
  expect(photos[0].alt).toMatch(/^AI-enhanced/);
  expect(photos[0].source).toContain('portfolio-nail-work.webp');
});
