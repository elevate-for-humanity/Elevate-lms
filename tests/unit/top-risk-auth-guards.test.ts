/**
 * Verify that the top-risk API routes from the security audit
 * have auth guards in their source code.
 *
 * This is a static analysis test — it reads the source files and
 * confirms the auth import and guard call are present. It does NOT
 * make HTTP requests (that requires a running server + Supabase).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readRoute(routePath: string): string {
  const fullPath = path.resolve(routePath);
  return fs.readFileSync(fullPath, 'utf8');
}

describe('Top-risk routes have auth guards', () => {
  it('/api/admin/promo-codes requires apiRequireAdmin', () => {
    const src = readRoute('app/api/admin/promo-codes/route.ts');
    expect(src).toContain("import { apiRequireAdmin } from '@/lib/admin/guards'");
    expect(src).toContain('await apiRequireAdmin()');
  });

  it('/api/payments/split requires apiAuthGuard', () => {
    const src = readRoute('app/api/payments/split/route.ts');
    expect(src).toContain("import { apiAuthGuard } from '@/lib/admin/guards'");
    expect(src).toContain('await apiAuthGuard(');
  });

  it('/api/store/create-payment-intent requires auth', () => {
    const src = readRoute('app/api/store/create-payment-intent/route.ts');
    const hasRequireAuth = src.includes("import { requireAuth } from '@/lib/api/requireAuth'");
    const hasApiAuthGuard = src.includes("import { apiAuthGuard } from '@/lib/admin/guards'");
    expect(hasRequireAuth || hasApiAuthGuard).toBe(true);
    const hasGuardCall = src.includes('await requireAuth(') || src.includes('await apiAuthGuard(');
    expect(hasGuardCall).toBe(true);
  });

  it('/api/stripe/connect/create requires apiRequireAdmin', () => {
    const src = readRoute('app/api/stripe/connect/create/route.ts');
    expect(src).toContain("import { apiRequireAdmin } from '@/lib/admin/guards'");
    expect(src).toContain('await apiRequireAdmin()');
  });

  it('/api/store/licenses/create-payment-intent requires apiAuthGuard', () => {
    const src = readRoute('app/api/store/licenses/create-payment-intent/route.ts');
    expect(src).toContain("import { apiAuthGuard } from '@/lib/admin/guards'");
    expect(src).toContain('await apiAuthGuard(');
  });

  it('/api/store/create-product requires apiRequireAdmin', () => {
    const src = readRoute('app/api/store/create-product/route.ts');
    expect(src).toContain("import { apiRequireAdmin } from '@/lib/admin/guards'");
    expect(src).toContain('await apiRequireAdmin()');
  });
});
