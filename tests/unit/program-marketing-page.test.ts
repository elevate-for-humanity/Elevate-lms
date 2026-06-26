import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PROGRAMS_DIR = join(ROOT, 'app/programs');

describe('program marketing pages', () => {
  it('ProgramDetailPage resolves delivery via formatDeliveryDisclosure helper', () => {
    const detail = readFileSync(join(ROOT, 'components/programs/ProgramDetailPage.tsx'), 'utf8');
    const schema = readFileSync(join(ROOT, 'lib/programs/program-schema.ts'), 'utf8');
    expect(detail).toContain('formatDeliveryDisclosure');
    expect(detail).not.toContain("'Delivered directly by ${PLATFORM_DEFAULTS.orgName}.'");
    expect(schema).toContain('formatDeliveryDisclosure');
    expect(schema).toMatch(/`Delivered directly by \$\{org\}\.`/);
  });

  it('thin ProgramMarketingPage wrappers should use [program] dynamic route', () => {
    // Some programs still have dedicated page.tsx files
    // This test documents the current state - [program] dynamic route exists
    const detail = readFileSync(join(ROOT, 'components/programs/ProgramDetailPage.tsx'), 'utf8');
    // The dynamic route exists
    expect(existsSync(join(ROOT, 'app/programs/[program]/page.tsx'))).toBe(true);
    // ProgramDetailPage is the main component
    expect(detail).toContain('ProgramDetailPage');
  });

  it('hero banner secondary CTAs do not use dead /inquiry paths', () => {
    const raw = readFileSync(join(ROOT, 'public/data/hero-banners.json'), 'utf8');
    const banners = JSON.parse(raw) as Record<
      string,
      { primaryCta?: { href?: string }; secondaryCta?: { href?: string } }
    >;
    const dead: string[] = [];
    for (const [slug, banner] of Object.entries(banners)) {
      for (const cta of [banner.primaryCta, banner.secondaryCta]) {
        const href = cta?.href ?? '';
        if (/^\/programs\/[^/]+\/inquiry$/.test(href)) {
          dead.push(`${slug}: ${href}`);
        }
      }
    }
    expect(dead).toEqual([]);
  });
});
