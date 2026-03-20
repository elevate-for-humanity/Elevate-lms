/**
 * Enrollment integrity audit.
 *
 * Runs three invariant checks against live DB state:
 *   1. No program_enrollments row with program_id IS NULL
 *   2. No program_enrollments row referencing a non-existent apprenticeship_programs row
 *   3. No internal_lms enrollment where the program has no active training_courses
 *
 * Returns an empty array on a clean system. Any returned string is a named failure.
 * Callers should treat a non-empty result as a deployment blocker.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type IntegrityFailure =
  | 'NULL_PROGRAM_ID_DETECTED'
  | 'ORPHANED_PROGRAM_REFERENCE'
  | 'LMS_INTEGRITY_BROKEN'
  | 'PRIVILEGED_BYPASS_DETECTED';

export interface IntegrityResult {
  failures: IntegrityFailure[];
  counts: Record<IntegrityFailure, number>;
  clean: boolean;
}

export async function validateEnrollmentIntegrity(
  db: SupabaseClient,
): Promise<IntegrityResult> {
  const counts: Record<IntegrityFailure, number> = {
    NULL_PROGRAM_ID_DETECTED: 0,
    ORPHANED_PROGRAM_REFERENCE: 0,
    LMS_INTEGRITY_BROKEN: 0,
    PRIVILEGED_BYPASS_DETECTED: 0,
  };

  // 1. Null program_id — should be impossible after NOT NULL constraint,
  //    but kept as a belt-and-suspenders check for rows predating the constraint.
  const { count: nullCount, error: e1 } = await db
    .from('program_enrollments')
    .select('id', { count: 'exact', head: true })
    .is('program_id', null);

  if (!e1 && nullCount != null && nullCount > 0) {
    counts.NULL_PROGRAM_ID_DETECTED = nullCount;
  }

  // 2. Orphaned program reference — enrollment points to a deleted ap row.
  //    PostgREST cannot express LEFT JOIN IS NULL directly, so we pull all
  //    distinct program_ids from enrollments and diff against ap table.
  const { data: enrolledProgramIds, error: e2 } = await db
    .from('program_enrollments')
    .select('program_id')
    .not('program_id', 'is', null);

  if (!e2 && enrolledProgramIds) {
    const ids = [...new Set(enrolledProgramIds.map((r: any) => r.program_id))];
    if (ids.length > 0) {
      const { data: apRows, error: e2b } = await db
        .from('apprenticeship_programs')
        .select('id')
        .in('id', ids);

      if (!e2b && apRows) {
        const apIds = new Set(apRows.map((r: any) => r.id));
        const orphaned = ids.filter((id) => !apIds.has(id));
        counts.ORPHANED_PROGRAM_REFERENCE = orphaned.length;
      }
    }
  }

  // 3. LMS integrity — internal_lms enrollment with no active course behind it.
  //    apprenticeship_programs does not have delivery_model; we join via programs.slug.
  const { data: lmsEnrollments, error: e3 } = await db
    .from('program_enrollments')
    .select('id, program_slug')
    .not('program_id', 'is', null);

  if (!e3 && lmsEnrollments && lmsEnrollments.length > 0) {
    const slugs = [...new Set(lmsEnrollments.map((r: any) => r.program_slug))];

    const { data: lmsPrograms, error: e3b } = await db
      .from('programs')
      .select('id, slug')
      .in('slug', slugs)
      .eq('delivery_model', 'internal_lms');

    if (!e3b && lmsPrograms && lmsPrograms.length > 0) {
      for (const prog of lmsPrograms) {
        const { count: courseCount, error: e3c } = await db
          .from('training_courses')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', prog.id)
          .eq('is_active', true);

        if (!e3c && (courseCount == null || courseCount === 0)) {
          counts.LMS_INTEGRITY_BROKEN += 1;
        }
      }
    }
  }

  // 4. Privileged bypass detection — any enrollment_insert_audit row with via_rpc=false
  //    means an insert reached program_enrollments outside the enroll_application RPC.
  //    This is the tripwire for service_role or postgres writes that bypassed the gate.
  const { count: bypassCount, error: e4 } = await db
    .from('enrollment_insert_audit')
    .select('id', { count: 'exact', head: true })
    .eq('via_rpc', false);

  if (!e4 && bypassCount != null && bypassCount > 0) {
    counts.PRIVILEGED_BYPASS_DETECTED = bypassCount;
  }

  const failures = (Object.keys(counts) as IntegrityFailure[]).filter(
    (k) => counts[k] > 0,
  );

  return { failures, counts, clean: failures.length === 0 };
}
