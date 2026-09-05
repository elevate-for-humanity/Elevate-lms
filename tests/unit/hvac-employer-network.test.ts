import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HVAC employer network', () => {
  it('publishes a statewide page and four regional search pages', () => {
    const regions = readFileSync('lib/marketing/hvac-employer-regions.ts', 'utf8');
    const sitemap = readFileSync('apps/marketing/app/sitemap.ts', 'utf8');
    for (const slug of ['indianapolis', 'fort-wayne', 'south-bend', 'evansville']) expect(regions).toContain(`slug: '${slug}'`);
    expect(sitemap).toContain('HVAC_EMPLOYER_REGIONS.map');
  });

  it('uses the verified credential stack and avoids placement guarantees', () => {
    const page = readFileSync('apps/marketing/app/employers/hvac-partners/page.tsx', 'utf8');
    expect(page).toContain('EPA Section 608');
    expect(page).toContain('OSHA 10, CPR, and Rise Up');
    expect(page).not.toContain('HVAC Excellence Employment Ready');
    expect(page).toContain('are not guaranteed');
  });
});
