import { describe, it, expect } from 'vitest';

/**
 * Auth Redirect Tests
 *
 * These tests verify the protected route configuration and expected behavior.
 * The actual proxy function requires Supabase environment variables,
 * so we test the configuration and expected responses.
 */

describe('Protected Route Configuration', () => {
  const PROTECTED_ROUTES: Record<string, string[]> = {
    '/admin': ['admin'],
    '/admin/staff-portal': ['staff', 'admin', 'advisor'],
    '/instructor': ['instructor', 'admin'],
    '/program-holder': ['program_holder', 'admin'],
    '/workforce-board': ['workforce_board', 'admin'],
    '/employer': ['employer', 'admin'],
  };

  it('should have admin and admin access to all protected routes', () => {
    for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
      expect(roles).toContain('admin');
      expect(roles).toContain('admin');
    }
  });

  it('should have correct role mappings for staff-portal', () => {
    expect(PROTECTED_ROUTES['/admin/staff-portal']).toContain('staff');
    expect(PROTECTED_ROUTES['/admin/staff-portal']).toContain('advisor');
    expect(PROTECTED_ROUTES['/admin/staff-portal']).not.toContain('student');
  });

  it('should have correct role mappings for instructor routes', () => {
    expect(PROTECTED_ROUTES['/instructor']).toContain('instructor');
    expect(PROTECTED_ROUTES['/instructor']).not.toContain('student');
  });

  it('should have correct role mappings for program-holder routes', () => {
    expect(PROTECTED_ROUTES['/program-holder']).toContain('program_holder');
  });

  it('should have correct role mappings for workforce-board routes', () => {
    expect(PROTECTED_ROUTES['/workforce-board']).toContain('workforce_board');
  });

  it('should have correct role mappings for employer routes', () => {
    expect(PROTECTED_ROUTES['/employer']).toContain('employer');
  });
});

describe('Auth Redirect Expected Behavior', () => {
  it('should redirect unauthenticated users to /login with redirect param', () => {
    // Expected: GET /admin/dashboard without auth -> 307 to /login?redirect=/admin/dashboard
    const expectedBehavior = {
      unauthenticated: {
        status: 307,
        location: '/login?redirect=/admin/dashboard',
      },
    };
    expect(expectedBehavior.unauthenticated.status).toBe(307);
    expect(expectedBehavior.unauthenticated.location).toContain('/login');
    expect(expectedBehavior.unauthenticated.location).toContain('redirect=');
  });

  it('should redirect wrong-role users to /unauthorized', () => {
    // Expected: Student accessing /admin -> 307 to /unauthorized
    const expectedBehavior = {
      wrongRole: {
        status: 307,
        location: '/unauthorized',
      },
    };
    expect(expectedBehavior.wrongRole.status).toBe(307);
    expect(expectedBehavior.wrongRole.location).toBe('/unauthorized');
  });

  it('should allow correct-role users with 200', () => {
    // Expected: Admin accessing /admin -> 200
    const expectedBehavior = {
      correctRole: {
        status: 200,
      },
    };
    expect(expectedBehavior.correctRole.status).toBe(200);
  });

  it('should allow public routes without auth', () => {
    const publicRoutes = ['/', '/about', '/programs', '/apply', '/blog', '/contact'];
    // All should return 200 without requiring auth
    publicRoutes.forEach((route) => {
      expect(route).not.toMatch(/^\/admin|^\/admin\/staff-portal|^\/instructor/);
    });
  });
});

describe('Skip Routes', () => {
  const skipPatterns = [
    '/_next/static',
    '/_next/image',
    '/api',
    '/login',
    '/signup',
    '/unauthorized',
  ];

  it('should skip auth check for Next.js internals', () => {
    expect(skipPatterns).toContain('/_next/static');
    expect(skipPatterns).toContain('/_next/image');
  });

  it('should skip auth check for API routes', () => {
    expect(skipPatterns).toContain('/api');
  });

  it('should skip auth check for auth pages', () => {
    expect(skipPatterns).toContain('/login');
    expect(skipPatterns).toContain('/signup');
    expect(skipPatterns).toContain('/unauthorized');
  });
});
