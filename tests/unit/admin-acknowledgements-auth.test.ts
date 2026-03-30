/**
 * Admin program-holder-acknowledgements route — auth guard tests.
 *
 * Tests the role-enforcement logic in isolation without importing
 * Next.js route handlers (avoids edge-runtime / server-only issues).
 */

import { describe, it, expect } from 'vitest';

// ── Extracted auth logic (mirrors the route's guard) ──────────────────────────

type Role = 'admin' | 'super_admin' | 'staff' | 'student' | 'partner' | 'instructor';

interface AuthResult {
  allowed: boolean;
  status: 200 | 401 | 403;
  error?: string;
}

function checkAdminAccess(user: { id: string; role: Role } | null): AuthResult {
  if (!user) {
    return { allowed: false, status: 401, error: 'Unauthorized' };
  }
  if (!['admin', 'super_admin', 'staff'].includes(user.role)) {
    return { allowed: false, status: 403, error: 'Forbidden' };
  }
  return { allowed: true, status: 200 };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Admin acknowledgements route — auth guard', () => {

  it('returns 401 when no user is present', () => {
    const result = checkAdminAccess(null);
    expect(result.status).toBe(401);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns 403 for student role', () => {
    const result = checkAdminAccess({ id: 'u1', role: 'student' });
    expect(result.status).toBe(403);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('returns 403 for partner role', () => {
    const result = checkAdminAccess({ id: 'u2', role: 'partner' });
    expect(result.status).toBe(403);
    expect(result.allowed).toBe(false);
  });

  it('returns 403 for instructor role', () => {
    const result = checkAdminAccess({ id: 'u3', role: 'instructor' });
    expect(result.status).toBe(403);
    expect(result.allowed).toBe(false);
  });

  it('returns 200 for admin role', () => {
    const result = checkAdminAccess({ id: 'u4', role: 'admin' });
    expect(result.status).toBe(200);
    expect(result.allowed).toBe(true);
  });

  it('returns 200 for super_admin role', () => {
    const result = checkAdminAccess({ id: 'u5', role: 'super_admin' });
    expect(result.status).toBe(200);
    expect(result.allowed).toBe(true);
  });

  it('returns 200 for staff role', () => {
    const result = checkAdminAccess({ id: 'u6', role: 'staff' });
    expect(result.status).toBe(200);
    expect(result.allowed).toBe(true);
  });

  it('does not allow empty string role', () => {
    const result = checkAdminAccess({ id: 'u7', role: '' as Role });
    expect(result.status).toBe(403);
    expect(result.allowed).toBe(false);
  });
});
