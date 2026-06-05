import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PROGRAMS_DIR = join(ROOT, 'app/programs');

describe('program marketing pages', () => {
  it('ProgramDetailPage uses interpolated org name for delivery disclosure', () => {
    const src = readFileSync(join(ROOT, 'components/programs/ProgramDetailPage.tsx'), 'utf8');
    expect(src).not.toContain("'Delivered directly by ${PLATFORM_DEFAULTS.orgName}.'");
    expect(src).toContain('getPublicOrgName');
    expect(src).toContain('`Delivered directly by ${orgName}.`');
  });

  it('dedicated program pages use ProgramMarketingPage (server-side hero banner)', () => {
    const dirs = readdirSync(PROGRAMS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('['))
      .map((d) => d.name);

    const offenders: string[] = [];
    for (const slug of dirs) {
      const pagePath = join(PROGRAMS_DIR, slug, 'page.tsx');
      if (!existsSync(pagePath)) continue;
      const content = readFileSync(pagePath, 'utf8');
      if (content.includes('redirect(') && content.split('\n').length < 15) continue;
      if (content.includes('ProgramDetailPage') && !content.includes('ProgramMarketingPage')) {
        offenders.push(slug);
      }
    }
    expect(offenders).toEqual([]);
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
