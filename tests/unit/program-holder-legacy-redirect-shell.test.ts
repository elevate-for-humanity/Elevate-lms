import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('program-holder legacy redirect layout', () => {
  it('retains authorization in the parent layout', () => {
    const parent = source('apps/lms/app/program-holder/layout.tsx');
    expect(parent).toContain('requireProgramHolder()');
  });

  it('does not mount a second dashboard frame before redirecting', () => {
    const legacy = source('apps/lms/app/program-holder/portal/layout.tsx');
    expect(legacy).toContain('return children');
    expect(legacy).not.toContain("from '@/components/program-holder/ProgramHolderSectionLayout'");
    expect(legacy).not.toContain("from '@/components/platform/PlatformShell'");
  });

  it.each([
    ['page/page.tsx', '/program-holder/dashboard'],
    ['students/page.tsx', '/program-holder/students'],
    ['reports/page.tsx', '/program-holder/reports'],
  ])('preserves the legacy %s redirect to %s', (relativePath, destination) => {
    const page = source('apps/lms/app/program-holder/portal/' + relativePath);
    expect(page).toContain('redirect(');
    expect(page).toContain(destination);
  });

  it.each(['students', 'reports'])('keeps the canonical %s dashboard frame', (section) => {
    const canonical = source('apps/lms/app/program-holder/' + section + '/layout.tsx');
    expect(canonical).toContain('ProgramHolderSectionLayout');
  });
});
