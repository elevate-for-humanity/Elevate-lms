import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('business administration campaign hero', () => {
  const route = fs.readFileSync(
    path.resolve('apps/marketing/app/programs/[program]/page.tsx'),
    'utf8',
  );
  const detail = fs.readFileSync(path.resolve('components/programs/ProgramDetailPage.tsx'), 'utf8');

  it('uses the current five-week program disclosure instead of an expired cohort promotion', () => {
    expect(route).toContain("resolved.slug === 'business-administration'");
    expect(route).toContain('const banner: HeroBannerConfig = isBusinessProgram');
    expect(route).toContain('posterImage: resolved.heroImage');
    expect(route).toContain('Business & Entrepreneurship — 5 Weeks');
    expect(route).toContain('href: resolved.cta.applyHref');
    expect(route).toContain('Review Payment Options');
    expect(route).not.toContain('/images/cohorts/business-october-15-cohort-flyer.jpg');
  });

  it('does not repeat the same campaign artwork below the hero', () => {
    expect(detail).toContain("p.slug !== 'business-administration'");
  });
});
