import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STATIC_PROGRAM_MAP } from '@/data/programs';
import { getProgramCardImage, getProgramHeroImage } from '@/lib/images/programImages';
import { PROGRAMS } from '@/lib/programs/programs.data';

const alignedStaticPrograms = [
  'construction-trades-certification',
  'hvac-technician',
  'peer-recovery-specialist',
  'qma',
  'sanitation-infection-control',
] as const;

describe('canonical program-image alignment', () => {
  it.each(alignedStaticPrograms)('%s uses its canonical hero asset', (slug) => {
    const program = STATIC_PROGRAM_MAP.get(slug);
    const hero = getProgramHeroImage(slug);

    expect(program?.heroImage).toBe(hero);
    expect(existsSync(`public${hero}`)).toBe(true);
  });

  it('keeps both HVAC catalog images on the canonical photograph', () => {
    const program = PROGRAMS.find(({ slug }) => slug === 'hvac-technician');

    expect(program?.cardImage).toBe(getProgramCardImage('hvac-technician'));
    expect(program?.heroImage).toBe(getProgramHeroImage('hvac-technician'));
  });

  it('makes the dedicated financial-literacy page consume the registry hero', () => {
    const page = readFileSync(
      'apps/marketing/app/programs/financial-literacy/page.tsx',
      'utf8',
    );

    expect(page).toContain('src={getProgramHeroImage(PROGRAM.slug)}');
    expect(page).not.toContain('src="/images/business/office-admin.webp"');
  });
});
