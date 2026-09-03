import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ClientWidgets page-load behavior', () => {
  const source = readFileSync(join(process.cwd(), 'components/layout/ClientWidgets.tsx'), 'utf8');

  it('defines the deferred SearchDialog component before rendering it', () => {
    expect(source).toContain("import('@/components/SearchDialog')");
    expect(source).toContain('<SearchDialog />');
  });

  it('does not mount SecurityMonitor on public marketing pages', () => {
    expect(source).toContain('const showSecurityMonitor =');
    expect(source).toContain('{showSecurityMonitor && <SecurityMonitor />}');
  });
});
