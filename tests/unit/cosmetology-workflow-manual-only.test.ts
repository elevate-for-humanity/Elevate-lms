import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Cosmetology paid workflow trigger', () => {
  const workflow = readFileSync(
    '.github/workflows/build-cosmetology-course.yml',
    'utf8',
  );

  it('is manual-only and cannot run from a main push or issue event', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s+push:/m);
    expect(workflow).not.toMatch(/^\s+issues:/m);
  });
});
