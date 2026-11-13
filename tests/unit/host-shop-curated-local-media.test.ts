import { describe, expect, it } from 'vitest';
import { curateShopGallery, shopGalleryForProgram } from '../../lib/partners/curated-shop-media';

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

it('removes the retired purple Prestige mockup even when supplied by the database', () => {
  expect(curateShopGallery('prestige-elevation-barber-and-beauty-institute', [{ url: '/images/partners/prestige-elevation/downtown-cosmetology-program.webp' }])).toEqual([]);
});
it('shows only occupation-appropriate media on each program page', () => {
  const photos = [
    { url: '/images/beauty/program-barber-training.webp' },
    { url: '/images/partners/prestige-elevation/official-portfolio-2026.jpg' },
    { url: '/images/partners/style-and-scissor-salon/manicure-enhanced-2026.webp' },
    { url: '/images/partners/mesmerized-by-beauty/downtown-esthetician-program.webp' },
  ];
  expect(shopGalleryForProgram('prestige-elevation', photos, 'barber-apprenticeship').map(p => p.url)).toEqual([photos[0].url]);
  expect(shopGalleryForProgram('prestige-elevation', photos, 'cosmetology-apprenticeship').map(p => p.url)).toEqual([photos[1].url]);
  expect(shopGalleryForProgram('prestige-elevation', photos, 'nail-technician-apprenticeship').map(p => p.url)).toEqual([photos[2].url]);
  expect(shopGalleryForProgram('prestige-elevation', photos, 'esthetician-apprenticeship').map(p => p.url)).toEqual([photos[3].url]);
});

it('uses official business branding when no trade-specific photograph is supplied', () => {
  const manicure = { url: '/images/partners/style-and-scissor-salon/manicure-enhanced-2026.webp' };
  expect(shopGalleryForProgram('style-and-scissor-salon', [manicure], 'cosmetology-apprenticeship', '/images/partners/style-and-scissor-salon/logo.webp')).toEqual([
    { url: '/images/partners/style-and-scissor-salon/logo.webp', alt: 'Official business logo' },
  ]);
});

it('never supplies photography or branding for an unsupported occupation', () => {
  expect(shopGalleryForProgram('salon', [], 'massage-apprenticeship', '/salon/logo.webp')).toEqual([]);
  expect(shopGalleryForProgram('salon', [{ url: '/salon/haircut.webp' }], '', '/salon/logo.webp')).toEqual([]);
});
