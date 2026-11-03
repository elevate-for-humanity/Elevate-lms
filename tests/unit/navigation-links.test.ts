import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

describe('NAV_ITEMS link resolution', () => {
  it('resolves every public header destination, including hosted business homepages', () => {
    const output = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/audit-nav-links.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8',
    });
    expect(output).toContain('Broken: 0');
  });
});
