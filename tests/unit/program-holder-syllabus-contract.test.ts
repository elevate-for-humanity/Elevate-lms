import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Program holder syllabus ownership', () => {
  it('does not block partner onboarding on a duplicate syllabus upload', () => {
    const source = readFileSync('lib/program-holder/onboarding-status.ts', 'utf8');
    const barberBranch = source.slice(
      source.indexOf('// Barber (default)'),
      source.indexOf('if (!requiredDocsComplete)'),
    );

    expect(barberBranch).not.toContain("document_type === 'syllabus'");
    expect(barberBranch).not.toContain("['Syllabus']");
    expect(barberBranch).toContain('requiredDocsComplete = hasBusinessLicense && hasInsurance');
  });
});
