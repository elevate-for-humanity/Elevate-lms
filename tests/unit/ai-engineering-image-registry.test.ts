// @vitest-environment node
import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import { PROGRAM_IMAGES } from '@/lib/images/programImages';
it('registers the existing AI Engineering program photograph for catalog and hero resolution', () => {
  const image = PROGRAM_IMAGES['ai-engineering'];
  expect(image).toEqual({ card: '/images/pages/admin-ai-studio-hero.webp', hero: '/images/pages/admin-ai-studio-hero.webp', alt: 'Developer working at a multi-screen workstation' });
  expect(existsSync('public' + image.hero)).toBe(true);
});
it('does not reuse another program image assignment', () => {
  const owned = PROGRAM_IMAGES['ai-engineering'];
  for (const [slug, image] of Object.entries(PROGRAM_IMAGES)) {
    if (slug === 'ai-engineering') continue;
    expect([image.card,image.hero]).not.toContain(owned.card);
  }
});
