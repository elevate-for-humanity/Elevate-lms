import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('business administration campaign hero', () => {
  const route = fs.readFileSync(
    path.resolve('apps/marketing/app/programs/[program]/page.tsx'),
    'utf8',
  );
  const detail = fs.readFileSync(path.resolve('components/programs/ProgramDetailPage.tsx'), 'utf8');

  it('uses the October cohort artwork as the first program hero', () => {
    expect(route).toContain('isBusinessProgram ? (');
    expect(route).toContain('/images/cohorts/business-october-15-cohort-flyer.jpg');
    expect(route).toContain(
      'aria-label="Apply for the Business Administration October 15, 2026 cohort"',
    );
    expect(route).toContain('priority');
  });

  it('does not repeat the same campaign artwork below the hero', () => {
    expect(detail).toContain("p.slug !== 'business-administration'");
  });
});
