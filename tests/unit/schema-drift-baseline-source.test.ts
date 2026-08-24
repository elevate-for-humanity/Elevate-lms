import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => readFileSync(path.resolve(relativePath), 'utf8');

describe('schema drift baseline source', () => {
  it('compares a migration-generated baseline against the migration schema in every environment', () => {
    const audit = source('scripts/audit-schema-drift.ts');

    expect(audit).toContain("baseline?.schemaSource?.startsWith('migrations')");
    expect(audit).toContain('!baselineUsesMigrations && supabaseUrl && serviceKey');
  });
});
