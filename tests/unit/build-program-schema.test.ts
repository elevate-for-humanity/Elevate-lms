import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildProgramSchemaFromPartial,
  buildProgramSchemaFromRegistry,
} from '@/lib/programs/build-program-schema';
import { resolveProgram } from '@/lib/program-registry';

describe('build-program-schema', () => {
  it('builds a valid schema for registry-only programs (reentry-specialist)', () => {
    const entry = resolveProgram('reentry-specialist');
    expect(entry).toBeDefined();
    const schema = buildProgramSchemaFromRegistry(entry!);
    expect(schema.slug).toBe('reentry-specialist');
    expect(schema.credentials.length).toBeGreaterThanOrEqual(3);
    expect(schema.outcomes.length).toBeGreaterThanOrEqual(5);
    expect(schema.cta.applyHref).toContain('reentry-specialist');
  });

  it('resolves slug aliases via load path inputs', () => {
    const schema = buildProgramSchemaFromPartial({
      slug: 'cpr-aed',
      title: 'CPR AED',
      category: 'Healthcare',
    });
    expect(schema.sector).toBe('healthcare');
    expect(schema.programType).toBe('certification');
  });
});

describe('single program page renderer', () => {
  it('[program]/page.tsx has no legacy ProgramPage or cf-programs fallback', () => {
    const page = readFileSync(join(process.cwd(), 'app/programs/[program]/page.tsx'), 'utf8');
    expect(page).not.toContain('cf-programs');
    expect(page).not.toContain('function ProgramPage');
    expect(page).not.toContain('ProgramPage');
    expect(page).toContain('loadProgramForPage');
    expect(page).toContain('ProgramDetailPageComponent');
  });

  it('cf-programs.ts is removed', () => {
    const exists = require('node:fs').existsSync(join(process.cwd(), 'content/cf-programs.ts'));
    expect(exists).toBe(false);
  });
});
