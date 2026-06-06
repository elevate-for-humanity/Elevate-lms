import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('admin monitoring routes', () => {
  it('audit-health imports createClient (prevents ReferenceError at runtime)', () => {
    const src = readFileSync(
      join(process.cwd(), 'apps/admin/app/api/admin/monitoring/audit-health/route.ts'),
      'utf8',
    );
    expect(src).toContain("from '@/lib/supabase/server'");
    expect(src).toContain('createClient');
    expect(src).toContain('apiRequireAdmin');
  });

  it('errors route maps auditFailures to errors for MonitoringClient', () => {
    const src = readFileSync(
      join(process.cwd(), 'apps/admin/app/api/admin/monitoring/errors/route.ts'),
      'utf8',
    );
    expect(src).toContain('errors,');
    expect(src).toContain('auditFailures: rows');
  });
});
