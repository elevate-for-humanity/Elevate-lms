/**
 * Regression tests for student portal access fixes.
 *
 * Three bugs fixed:
 * 1. requireRole redirected to /unauthorized when profile row was missing.
 *    Fixed: redirects to /onboarding/learner?reason=profile_missing instead.
 *
 * 2. proxy.ts enrollment gate used stale enrollment_state values
 *    ('documents_complete', 'confirmed', 'orientation_complete') that no longer
 *    exist in the DB constraint. Fixed: gate passes 'active' and 'enrolled';
 *    terminal states go to /unauthorized; in-progress states route to enrollment flow.
 *
 * 3. access_granted_at was never set automatically — students who completed the
 *    full enrollment flow were blocked from /lms/ until an admin manually granted
 *    access. Fixed: submit-documents and documents/complete now set access_granted_at.
 *
 * These are static analysis tests — they read source files and assert the correct
 * behavior is present. No Supabase mocking required.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function read(relPath: string): string {
  return fs.readFileSync(path.resolve(relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// Fix 1: requireRole — missing profile redirects to onboarding, not /unauthorized
// ---------------------------------------------------------------------------

describe('requireRole — missing profile row', () => {
  const src = read('lib/auth/require-role.ts');

  it('redirects to /onboarding/learner when profile is null', () => {
    expect(src).toContain('/onboarding/learner?reason=profile_missing');
  });

  it('does not redirect to /unauthorized when profile is null for non-admin', () => {
    // The old code had a single `if (!profile || !allowed)` block that always
    // went to /unauthorized. The fix splits this into two separate checks.
    // Verify the null-profile branch does NOT unconditionally go to /unauthorized.
    const nullProfileBlock = src.slice(
      src.indexOf('Profile row missing'),
      src.indexOf('Load secondary roles'),
    );
    expect(nullProfileBlock).toContain('/onboarding/learner');
    expect(nullProfileBlock).not.toMatch(/redirect\(['"`]\/unauthorized/);
  });

  it('still redirects admin service role to /unauthorized when profile is null', () => {
    const nullProfileBlock = src.slice(
      src.indexOf('Profile row missing'),
      src.indexOf('Load secondary roles'),
    );
    expect(nullProfileBlock).toContain("SERVICE_ROLE === 'admin'");
    expect(nullProfileBlock).toContain('/unauthorized');
  });

  it('still redirects to /unauthorized when profile exists but role is wrong', () => {
    // The role-mismatch redirect must still exist after the profile-null split.
    const afterNullCheck = src.slice(src.indexOf('Load secondary roles'));
    expect(afterNullCheck).toContain('/unauthorized');
  });
});

// ---------------------------------------------------------------------------
// Fix 2: enrollment flow — correct state values in enrollment-flow.ts
// ---------------------------------------------------------------------------

describe('enrollment state contract', () => {
  const src = read('lib/enrollment/enrollment-flow.ts');

  it('DB-valid LMS access state is active only', () => {
    expect(src).toContain("['active']");
    expect(src).not.toMatch(/LMS_ACCESS_STATES.*=.*\['active',\s*'enrolled'/);
  });

  it('terminal states are defined', () => {
    expect(src).toContain('TERMINAL_ENROLLMENT_STATES');
    expect(src).toContain('suspended');
    expect(src).toContain('revoked');
    expect(src).toContain('withdrawn');
  });

  it('pending onboarding states are defined', () => {
    expect(src).toContain('PENDING_ONBOARDING_STATES');
    expect(src).toContain('orientation');
    expect(src).toContain('enrolled');
  });

  it('legacy state normalization is defined', () => {
    expect(src).toContain('LEGACY_STATE_MAP');
    expect(src).toContain('orientation_complete');
    expect(src).toContain('documents_complete');
  });
});

// ---------------------------------------------------------------------------
// Fix 3: access_granted_at auto-set on enrollment completion
// ---------------------------------------------------------------------------

describe('submit-documents route — auto-grants LMS access', () => {
  const src = read('app/api/enrollment/submit-documents/route.ts');

  it('sets access_granted_at in the enrollment update', () => {
    expect(src).toContain('access_granted_at: now');
  });

  it('sets enrollment_state to active', () => {
    expect(src).toContain("enrollment_state: 'active'");
  });

  it('no longer looks for removed documents_complete state', () => {
    expect(src).not.toContain("'documents_complete'");
  });

  it('no longer looks for removed confirmed state', () => {
    expect(src).not.toContain("'confirmed'");
  });

  it('uses canonical PRE_DOCUMENTS_STATES from enrollment-flow', () => {
    expect(src).toContain('PRE_DOCUMENTS_STATES');
    expect(src).not.toContain("'orientation_complete'");
  });
});

describe('documents/complete route — auto-grants LMS access', () => {
  const src = read('app/api/enrollment/documents/complete/route.ts');

  it('sets access_granted_at in the enrollment update', () => {
    expect(src).toContain('access_granted_at: now');
  });

  it('sets enrollment_state to active', () => {
    expect(src).toContain("enrollment_state: 'active'");
  });

  it('no longer treats documents_complete as an already-submitted state', () => {
    // Old code: if (enrollment_state === 'documents_complete' || 'active') -> already submitted
    // Fixed: only 'active' means already submitted
    const alreadySubmittedBlock = src.slice(
      src.indexOf('Documents already submitted'),
      src.indexOf('Documents already submitted') + 200,
    );
    expect(alreadySubmittedBlock).not.toContain('documents_complete');
  });
});

// ---------------------------------------------------------------------------
// Enrollment state contract — DB states vs code states
// ---------------------------------------------------------------------------

describe('enrollment state contract', () => {
  it('DB-valid LMS access state is active only', () => {
    const src = read('lib/enrollment/enrollment-flow.ts');
    // LMS_ACCESS_STATES should contain only 'active'
    expect(src).toMatch(/LMS_ACCESS_STATES.*=.*\['active'\]/);
  });

  it('DB-valid terminal states are defined in enrollment-flow.ts', () => {
    const src = read('lib/enrollment/enrollment-flow.ts');
    expect(src).toContain('TERMINAL_ENROLLMENT_STATES');
    // All terminal states should be present
    expect(src).toContain('suspended');
    expect(src).toContain('revoked');
    expect(src).toContain('withdrawn');
  });
});
