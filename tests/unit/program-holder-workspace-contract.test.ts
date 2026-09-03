import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workspace = readFileSync('lib/program-holder/workspace.ts', 'utf8');
const navigation = readFileSync('lib/navigation/navigation-config.ts', 'utf8');

describe('Program Holder workspace contract', () => {
  it('uses canonical program enrollments for the enrolled roster', () => {
    expect(workspace).toContain("from('program_enrollments')");
    expect(workspace).toContain("eq('program_holder_id', holderId)");
  });

  it('keeps applicants separate from enrolled students', () => {
    expect(workspace).toContain("from('program_holder_students')");
    expect(workspace).toContain("in('status', ['applied', 'pending'])");
  });

  it.each(['students', 'programs', 'hours', 'compliance', 'documents', 'reports', 'settings'])(
    'exposes the %s workspace route',
    (route) => expect(navigation).toContain(`/program-holder/${route}`),
  );
});
