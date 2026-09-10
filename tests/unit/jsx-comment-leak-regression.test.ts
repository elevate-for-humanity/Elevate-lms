import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const filesWithDirectImageContractChildren = [
  'apps/marketing/app/career-assessment/page.tsx',
  'components/FacebookPixel.tsx',
  'components/programs/onet/OnetLaborData.tsx',
  'components/admin/course-builder/ProgramBuilderClient.tsx',
  'components/admin/course-builder/ProgramIdentitySection.tsx',
  'components/lms/activities/ComponentLabeling.tsx',
];

describe('JSX comment leak regressions', () => {
  it('uses JSX comments for image-contract notes that sit inside rendered elements', () => {
    for (const file of filesWithDirectImageContractChildren) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      expect(source, file).not.toMatch(/^\s*\/\/ IMAGE-CONTRACT:/m);
      // A JSX contract comment is optional; the invariant is that a JavaScript
      // line comment never leaks into rendered JSX text.
    }
  });
});
