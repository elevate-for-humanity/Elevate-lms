import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('program integrity contract', () => {
  const source = readFileSync(resolve('scripts/check-program-integrity.ts'), 'utf8');

  it('requires modules only for programs backed by an LMS course', () => {
    expect(source).toContain("check.label !== 'modules' || program.has_lms_course === true");
    expect(source).toContain(".select('id, slug, title, has_lms_course')");
  });
});
