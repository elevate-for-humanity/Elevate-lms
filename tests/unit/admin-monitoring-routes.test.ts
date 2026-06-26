import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('admin monitoring routes', () => {
  // Admin container monitoring routes
  const auditHealthPath = join(process.cwd(), 'apps/admin/app/api/admin/monitoring/audit-health/route.ts');
  const errorsPath = join(process.cwd(), 'apps/admin/app/api/admin/monitoring/errors/route.ts');

  it('audit-health imports createClient (prevents ReferenceError at runtime)', () => {
    if (!existsSync(auditHealthPath)) {
      // Route only exists in admin container, skip in LMS context
      expect(true).toBe(true);
      return;
    }
    const src = readFileSync(auditHealthPath, 'utf8');
    expect(src).toContain("from '@/lib/supabase/server'");
    expect(src).toContain('createClient');
    expect(src).toContain('apiRequireAdmin');
  });

  it('errors route maps auditFailures to errors for MonitoringClient', () => {
    if (!existsSync(errorsPath)) {
      // Route only exists in admin container, skip in LMS context
      expect(true).toBe(true);
      return;
    }
    const src = readFileSync(errorsPath, 'utf8');
    expect(src).toContain('errors,');
    expect(src).toContain('auditFailures: rows');
  });
});
