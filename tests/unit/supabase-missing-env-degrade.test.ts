import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('missing Supabase env degradation', () => {
  it('skips optional security logging before creating a server Supabase client', () => {
    const source = readFileSync(join(process.cwd(), 'lib/actions/security.ts'), 'utf8');

    expect(source).toContain('isSupabaseConfigured');

    const guardIndex = source.indexOf('if (!isSupabaseConfigured())');
    const createClientIndex = source.indexOf('await createClient()');

    expect(guardIndex).toBeGreaterThan(-1);
    expect(createClientIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeLessThan(createClientIndex);
  });

  it('keeps the public program catalog database-only when Supabase is not configured', () => {
    const publicPageSource = readFileSync(
      join(process.cwd(), 'lib/programs/public-programs-page.ts'),
      'utf8',
    );
    const catalogSource = readFileSync(
      join(process.cwd(), 'lib/programs/load-program-catalog.ts'),
      'utf8',
    );

    expect(publicPageSource).toContain('createPublicClient()');
    expect(publicPageSource).toContain("catalogSource: 'database'");
    expect(catalogSource).toContain("source: 'database'");
    expect(catalogSource).not.toContain("from '@/data/programs'");
  });
});
