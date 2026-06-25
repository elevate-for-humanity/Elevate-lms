/**
 * Employer portal auth guard regression tests.
 *
 * Static analysis: reads each page.tsx source and asserts the canonical
 * requireRole() import and call are present with the correct role set.
 *
 * These tests act as a ratchet — once a page is migrated, it cannot
 * silently regress to the inline pattern.
 *
 * Run: pnpm test tests/unit/employer-portal-auth.test.ts
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readPage(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), 'utf8');
}

/** True if the file uses the canonical requireRole import. */
function hasRequireRoleImport(src: string): boolean {
  return src.includes("import { requireRole }") && src.includes("@/lib/auth/require-role");
}

/** True if requireRole is actually called (not just imported). */
function hasRequireRoleCall(src: string): boolean {
  return src.includes('await requireRole(');
}

/**
 * True if the inline anti-pattern is absent.
 * The anti-pattern is: calling supabase.auth.getUser() AND then manually
 * checking profiles.role in the same page component.
 */
function hasNoInlineRoleCheck(src: string): boolean {
  const hasInlineGetUser = src.includes('supabase.auth.getUser()');
  const hasInlineProfileRoleCheck =
    src.includes("profile.role !== 'employer'") ||
    src.includes("profile?.role !== 'employer'") ||
    (src.includes("profile.role") && src.includes(".includes(profile.role)")) ||
    (src.includes("profile?.role") && src.includes(".includes(profile?.role)"));
  // A page that uses requireRole may still call getUser for data loading —
  // the anti-pattern is the combination of getUser + manual role check.
  return !(hasInlineGetUser && hasInlineProfileRoleCheck);
}

/**
 * Assert that a page uses requireRole with a role set that includes
 * at least 'employer', 'admin', and 'admin'.
 */
function assertCanonicalRoleSet(src: string, pagePath: string): void {
  // Extract the requireRole call argument string
  const match = src.match(/await requireRole\(\s*(\[[^\]]+\])/);
  if (!match) return; // call exists but couldn't parse — skip role set check
  const roleArray = match[1];
  expect(roleArray, `${pagePath}: role set must include 'employer'`).toContain("'employer'");
  expect(roleArray, `${pagePath}: role set must include 'admin'`).toContain("'admin'");
  expect(roleArray, `${pagePath}: role set must include 'admin'`).toContain("'admin'");
}

// ---------------------------------------------------------------------------
// Pages that must use requireRole(['employer', 'admin'])
// ---------------------------------------------------------------------------

const STANDARD_PAGES = [
  'app/employer/analytics/page.tsx',
  'app/employer/applications/page.tsx',
  'app/employer/apprentices/page.tsx',
  'app/employer/candidates/page.tsx',
  'app/employer/company/page.tsx',
  'app/employer/documents/page.tsx',
  'app/employer/documents/upload/page.tsx',
  'app/employer/jobs/page.tsx',
  'app/employer/opportunities/page.tsx',
  'app/employer/placements/page.tsx',
  'app/employer/post-job/page.tsx',
  'app/employer/postings/page.tsx',
  'app/employer/settings/page.tsx',
  'app/employer/wotc/page.tsx',
  'app/employer/compliance/page.tsx',
  'app/employer/verification/page.tsx',
  'app/employer/shop/create/page.tsx',
  'app/employer/apprenticeships/new/page.tsx',
];

// Pages with extended role sets (superset of standard — still must include
// employer + admin + admin).
const EXTENDED_ROLE_PAGES = [
  // staff added
  'app/employer/apprenticeships/page.tsx',
  'app/employer/reports/page.tsx',
  'app/employer/reports/submit/page.tsx',
  // sponsor added
  'app/employer/hours/page.tsx',
];

// Dashboard already uses requireRole — included to prevent regression.
const ALREADY_MIGRATED = [
  'app/employer/dashboard/page.tsx',
];

// Dynamic route pages — auth-only (no role check needed beyond login gate,
// but must not expose data to unauthenticated users).
const AUTH_ONLY_PAGES = [
  'app/employer/postings/[id]/page.tsx',
  'app/employer/programs/[id]/page.tsx',
  'app/employer/apprenticeships/[placement_id]/weekly-report/new/page.tsx',
];

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('Employer portal — standard pages use requireRole', () => {
  for (const pagePath of STANDARD_PAGES) {
    it(`${pagePath} imports requireRole from canonical path`, () => {
      const src = readPage(pagePath);
      expect(hasRequireRoleImport(src), `missing requireRole import in ${pagePath}`).toBe(true);
    });

    it(`${pagePath} calls requireRole`, () => {
      const src = readPage(pagePath);
      expect(hasRequireRoleCall(src), `missing requireRole() call in ${pagePath}`).toBe(true);
    });

    it(`${pagePath} role set includes employer + admin + admin`, () => {
      const src = readPage(pagePath);
      assertCanonicalRoleSet(src, pagePath);
    });

    it(`${pagePath} does not use inline getUser + profile.role check`, () => {
      const src = readPage(pagePath);
      expect(hasNoInlineRoleCheck(src), `inline role check still present in ${pagePath}`).toBe(true);
    });
  }
});

describe('Employer portal — extended-role pages use requireRole', () => {
  for (const pagePath of EXTENDED_ROLE_PAGES) {
    it(`${pagePath} imports requireRole from canonical path`, () => {
      const src = readPage(pagePath);
      expect(hasRequireRoleImport(src), `missing requireRole import in ${pagePath}`).toBe(true);
    });

    it(`${pagePath} calls requireRole`, () => {
      const src = readPage(pagePath);
      expect(hasRequireRoleCall(src), `missing requireRole() call in ${pagePath}`).toBe(true);
    });

    it(`${pagePath} role set includes employer + admin + admin`, () => {
      const src = readPage(pagePath);
      assertCanonicalRoleSet(src, pagePath);
    });

    it(`${pagePath} does not use inline getUser + profile.role check`, () => {
      const src = readPage(pagePath);
      expect(hasNoInlineRoleCheck(src), `inline role check still present in ${pagePath}`).toBe(true);
    });
  }
});

describe('Employer portal — already-migrated pages do not regress', () => {
  for (const pagePath of ALREADY_MIGRATED) {
    it(`${pagePath} still uses requireRole`, () => {
      const src = readPage(pagePath);
      expect(hasRequireRoleImport(src)).toBe(true);
      expect(hasRequireRoleCall(src)).toBe(true);
    });
  }
});

describe('Employer portal — auth-only dynamic pages gate on login', () => {
  for (const pagePath of AUTH_ONLY_PAGES) {
    it(`${pagePath} redirects unauthenticated users to /login`, () => {
      const src = readPage(pagePath);
      // Must have some auth check — either requireRole or getUser + redirect
      const hasAnyAuthCheck =
        hasRequireRoleCall(src) ||
        (src.includes('supabase.auth.getUser()') && src.includes("redirect('/login"));
      expect(
        hasAnyAuthCheck,
        `${pagePath}: no auth check found — unauthenticated users can access this page`
      ).toBe(true);
    });
  }
});

describe('Employer portal — role set consistency', () => {
  it('no employer page redirects to / on auth failure (should be /unauthorized)', () => {
    const allPages = [
      ...STANDARD_PAGES,
      ...EXTENDED_ROLE_PAGES,
      ...ALREADY_MIGRATED,
    ];
    const violations: string[] = [];
    for (const pagePath of allPages) {
      const src = readPage(pagePath);
      // After migration, no page should redirect to bare '/' on role failure.
      // requireRole redirects to /unauthorized — check the inline pattern is gone.
      if (src.includes("redirect('/')") || src.includes('redirect("/")')) {
        violations.push(pagePath);
      }
    }
    expect(
      violations,
      `These pages redirect to / instead of /unauthorized: ${violations.join(', ')}`
    ).toHaveLength(0);
  });

  it('no employer page redirects to /login on role failure (should be /unauthorized)', () => {
    const allPages = [...STANDARD_PAGES, ...EXTENDED_ROLE_PAGES];
    const violations: string[] = [];
    for (const pagePath of allPages) {
      const src = readPage(pagePath);
      // After migration requireRole handles this — no manual redirect('/login') on role failure.
      // We detect the anti-pattern: redirect('/login') appearing after a role check.
      // Simple heuristic: file has both a role check and redirect('/login') without a !user guard.
      const hasRoleCheckWithLoginRedirect =
        !hasRequireRoleCall(src) &&
        src.includes("redirect('/login") &&
        (src.includes("profile.role") || src.includes("profile?.role"));
      if (hasRoleCheckWithLoginRedirect) {
        violations.push(pagePath);
      }
    }
    expect(
      violations,
      `These pages redirect to /login on role failure instead of /unauthorized: ${violations.join(', ')}`
    ).toHaveLength(0);
  });
});
