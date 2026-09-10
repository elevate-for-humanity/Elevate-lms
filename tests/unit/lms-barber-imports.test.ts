import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('barber LMS course pages', () => {
  it('import barber constants used in course detail page', () => {
    const src = readFileSync(
      join(process.cwd(), 'apps/lms/app/lms/courses/[courseId]/page.tsx'),
      'utf8',
    );
    expect(src).toContain("from '@/lib/apprenticeship/registered-program-contract'");
    expect(src).toMatch(/getRegisteredProgramStandard/);
    expect(src).toMatch(/registeredContract/);
  });

  it('import barber constants used in courses list page', () => {
    const src = readFileSync(join(process.cwd(), 'apps/lms/app/lms/courses/page.tsx'), 'utf8');
    expect(src).toContain("from '@/lib/enrollments/getUserEnrollments'");
    expect(src).toContain('enrollment.continue_url');
  });
});
