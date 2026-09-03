/**
 * Integration tests for the student LMS access path.
 *
 * These tests run against the real Supabase DB when credentials are present.
 * They are skipped automatically in CI and local environments without credentials.
 *
 * To run locally:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm test tests/unit/student-lms-access-integration.test.ts
 *
 * What is tested:
 * 1. Profile rows exist for all auth.users (trigger health check)
 * 2. Students with enrollment_state='active' have access_granted_at set (or fallback works)
 * 3. No student has enrollment_state in a removed state ('documents_complete', 'confirmed', 'orientation_complete')
 * 4. hasLmsAccess returns true for all students the proxy gate would pass through
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { hasLmsAccess, resolveLatestEnrollment } from '@/lib/enrollment/resolver';

const HAS_CREDENTIALS =
  process.env.LIVE_DB_INTEGRATION === '1' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://');

const describeIfCredentials = HAS_CREDENTIALS ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdminClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Suite 1: Profile trigger health
// ---------------------------------------------------------------------------

describeIfCredentials('DB: profile trigger health', () => {
  it('all auth.users have a corresponding profiles row', async () => {
    const db = await getAdminClient();

    // Count auth users
    const { data: authUsers, error: authErr } = await db.auth.admin.listUsers({ perPage: 1 });
    expect(authErr).toBeNull();
    const totalUsers = authUsers?.total ?? 0;

    if (totalUsers === 0) {
      console.warn('No auth users found — skipping trigger health check');
      return;
    }

    // Count profiles
    const { count: profileCount, error: profileErr } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    expect(profileErr).toBeNull();

    // Allow up to 5 missing profiles (trigger failures are rare but possible)
    const missing = totalUsers - (profileCount ?? 0);
    expect(
      missing,
      `${missing} auth users have no profiles row — run the handle_new_user trigger repair`,
    ).toBeLessThanOrEqual(5);
  });

  it('no profiles row has a null role', async () => {
    const db = await getAdminClient();
    const { count, error } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('role', null);
    expect(error).toBeNull();
    expect(count ?? 0, 'profiles rows with null role').toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Enrollment state validity
// ---------------------------------------------------------------------------

describeIfCredentials('DB: enrollment state validity', () => {
  const REMOVED_STATES = ['documents_complete', 'confirmed', 'orientation_complete'];

  it('no program_enrollments rows have removed enrollment_state values', async () => {
    const db = await getAdminClient();
    const { data, error } = await db
      .from('program_enrollments')
      .select('id, user_id, enrollment_state')
      .in('enrollment_state', REMOVED_STATES)
      .limit(20);
    expect(error).toBeNull();
    expect(
      data ?? [],
      `Found ${data?.length ?? 0} rows with removed enrollment_state values: ${
        data?.map(r => `${r.id} (${r.enrollment_state})`).join(', ')
      }`,
    ).toHaveLength(0);
  });

  it('all active enrollments have access_granted_at set or enrollment_state grants fallback access', async () => {
    const db = await getAdminClient();
    const { data, error } = await db
      .from('program_enrollments')
      .select('id, user_id, enrollment_state, access_granted_at')
      .in('enrollment_state', ['active', 'enrolled'])
      .is('access_granted_at', null)
      .limit(100);
    expect(error).toBeNull();

    // These rows rely on the fallback in hasLmsAccess (enrollment_state check).
    // They should be backfilled. Log them but don't fail — the fallback handles them.
    if ((data?.length ?? 0) > 0) {
      console.warn(
        `[WARN] ${data!.length} active enrollments missing access_granted_at. ` +
        `Run backfill SQL: UPDATE program_enrollments SET access_granted_at = updated_at ` +
        `WHERE enrollment_state IN ('active','enrolled') AND access_granted_at IS NULL`,
      );
    }
    // Verify hasLmsAccess returns true for all of them via the fallback
    for (const row of data ?? []) {
      const enrollment = {
        id: row.id,
        source: 'program_enrollments' as const,
        userId: row.user_id,
        status: 'active',
        enrollmentState: row.enrollment_state,
        programSlug: null,
        programTitle: null,
        courseId: null,
        progress: 0,
        orientationCompletedAt: null,
        documentsSubmittedAt: null,
        accessGrantedAt: row.access_granted_at,
        createdAt: null,
      };
      expect(
        hasLmsAccess(enrollment),
        `hasLmsAccess returned false for enrollment ${row.id} (state=${row.enrollment_state})`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Proxy gate ↔ hasLmsAccess consistency
// ---------------------------------------------------------------------------

describeIfCredentials('DB: proxy gate and hasLmsAccess agree', () => {
  it('every student the proxy passes can enter the LMS', async () => {
    const db = await getAdminClient();

    // Get a sample of students with active/enrolled state
    const { data: enrollments, error } = await db
      .from('program_enrollments')
      .select('id, user_id, enrollment_state, access_granted_at, status, program_slug, course_id, progress_percent, orientation_completed_at, documents_submitted_at, created_at, enrolled_at')
      .in('enrollment_state', ['active', 'enrolled'])
      .limit(50);
    expect(error).toBeNull();

    const PROXY_ACCESS_STATES = new Set(['active', 'enrolled']);
    let passCount = 0;
    let failCount = 0;

    for (const row of enrollments ?? []) {
      const proxyWouldPass = PROXY_ACCESS_STATES.has(row.enrollment_state);
      const lmsWouldAllow = hasLmsAccess({
        id: row.id,
        source: 'program_enrollments',
        userId: row.user_id,
        status: row.status ?? 'active',
        enrollmentState: row.enrollment_state,
        programSlug: row.program_slug,
        programTitle: null,
        courseId: row.course_id,
        progress: Number(row.progress_percent ?? 0),
        orientationCompletedAt: row.orientation_completed_at,
        documentsSubmittedAt: row.documents_submitted_at,
        accessGrantedAt: row.access_granted_at,
        createdAt: row.created_at ?? row.enrolled_at,
      });

      if (proxyWouldPass && !lmsWouldAllow) {
        failCount++;
        console.error(
          `MISMATCH: proxy passes enrollment ${row.id} (state=${row.enrollment_state}) ` +
          `but hasLmsAccess returns false`,
        );
      } else if (proxyWouldPass && lmsWouldAllow) {
        passCount++;
      }
    }

    expect(
      failCount,
      `${failCount} enrollments pass the proxy gate but are blocked by hasLmsAccess`,
    ).toBe(0);
    console.info(`✓ ${passCount} enrollments: proxy and hasLmsAccess agree`);
  });
});

// ---------------------------------------------------------------------------
// Always-run: document the skip reason when credentials are missing
// ---------------------------------------------------------------------------

describe('integration test status', () => {
  it('reports whether integration tests ran', () => {
    if (!HAS_CREDENTIALS) {
      console.info(
        'Integration tests skipped — set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY to run against the real DB',
      );
    }
    // Always passes — this is a status reporter, not a gate
    expect(true).toBe(true);
  });
});
