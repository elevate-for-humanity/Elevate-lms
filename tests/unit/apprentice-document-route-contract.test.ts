import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('apprentice document route contract', () => {
  it('routes generic and legacy document links to the canonical apprentice center', () => {
    const genericUpload = readFileSync('apps/lms/app/documents/upload/page.tsx', 'utf8');
    const legacyStudent = readFileSync(
      'apps/lms/app/student-portal/documents/page.tsx',
      'utf8',
    );

    expect(genericUpload).toContain("redirect('/apprentice/documents')");
    expect(legacyStudent).toContain("redirect('/apprentice/documents')");
    expect(genericUpload).not.toContain("redirect('/student-portal/documents')");
  });
});
