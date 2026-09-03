import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('barber LMS course pages', () => {
  it('import barber constants used in course detail page', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/lms/(app)/courses/[courseId]/page.tsx'),
      'utf8',
    );
    expect(src).toContain("from '@/lib/barber/constants'");
    expect(src).toContain("from '@/lib/barber/branding'");
    expect(src).toMatch(/BARBER_COURSE_ID/);
    expect(src).toMatch(/BARBER_CURRICULUM_COVER/);
  });

  it('import barber constants used in courses list page', () => {
    const src = readFileSync(join(process.cwd(), 'app/lms/(app)/courses/page.tsx'), 'utf8');
    expect(src).toContain("from '@/lib/barber/constants'");
    expect(src).toContain("from '@/lib/barber/branding'");
  });
});
