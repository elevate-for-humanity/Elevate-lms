/**
 * lib/lms/engine/org-scope.ts
 *
 * Read-only query helpers for organization-scoped data access.
 * Used by the partner portal and reporting API.
 *
 * All functions require await getAdminClient() — they bypass RLS and apply
 * org scoping explicitly. Callers must verify org membership before
 * calling these (see lib/auth/org-guard.ts).
 *
 * getOrgProgress uses aggregated queries rather than per-learner loops.
 * It does not call getLearnerProgress.
 */

import { getAdminClient } from '@/lib/supabase/admin';

// ─── Internal helper ──────────────────────────────────────────────────────────

function requireDb(caller: string) {
  const db = await getAdminClient();
  if (!db) throw new Error(`${caller}: admin client unavailable (missing service role key)`);
  return db;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgProgram {
  programId:        string;
  programName:      string;
  programSlug:      string;
  relationshipType: string;
  isActive:         boolean;
}

export interface OrgCohort {
  cohortId:      string;
  name:          string;
  programId:     string | null;
  startDate:     string | null;
  endDate:       string | null;
  deliveryMode:  string | null;
  status:        string;
  enrolledCount: number;
}

export interface OrgLearner {
  userId:           string;
  fullName:         string | null;
  email:            string;
  cohortId:         string;
  cohortName:       string;
  enrollmentStatus: string;
  enrolledAt:       string;
}

export interface OrgProgressSummary {
  organizationId:     string;
  cohortId:           string | null;
  totalLearners:      number;
  completedLearners:  number;
  avgProgressPercent: number;
  certificatesIssued: number;
}

export interface OrgReportFilters {
  organizationId:    string;
  cohortId?:         string;
  programId?:        string;
  dateFrom?:         string;
  dateTo?:           string;
  credentialStatus?: 'issued' | 'pending' | 'expired' | 'revoked';
}

// ─── getOrgPrograms ───────────────────────────────────────────────────────────

export async function getOrgPrograms(organizationId: string): Promise<OrgProgram[]> {
  const db = requireDb('getOrgPrograms');

  const { data, error } = await db
    .from('program_organizations')
    .select(`
      relationship_type,
      is_active,
      programs:program_id ( id, name, slug )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) throw new Error(`getOrgPrograms: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    programId:        row.programs.id,
    programName:      row.programs.name,
    programSlug:      row.programs.slug,
    relationshipType: row.relationship_type,
    isActive:         row.is_active,
  }));
}

// ─── getOrgCohorts ────────────────────────────────────────────────────────────

export async function getOrgCohorts(organizationId: string): Promise<OrgCohort[]> {
  const db = requireDb('getOrgCohorts');

  const { data, error } = await db
    .from('cohorts')
    .select(`
      id, name, program_id, start_date, end_date,
      delivery_mode, status,
      cohort_enrollments ( id )
    `)
    .eq('organization_id', organizationId)
    .order('start_date', { ascending: false });

  if (error) throw new Error(`getOrgCohorts: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    cohortId:      row.id,
    name:          row.name,
    programId:     row.program_id ?? null,
    startDate:     row.start_date ?? null,
    endDate:       row.end_date ?? null,
    deliveryMode:  row.delivery_mode ?? null,
    status:        row.status,
    enrolledCount: Array.isArray(row.cohort_enrollments) ? row.cohort_enrollments.length : 0,
  }));
}

// ─── getOrgLearners ───────────────────────────────────────────────────────────

export async function getOrgLearners(
  organizationId: string,
  cohortId?: string
): Promise<OrgLearner[]> {
  const db = requireDb('getOrgLearners');

  let query = db
    .from('cohort_enrollments')
    .select(`
      learner_id,
      enrollment_status,
      enrolled_at,
      cohorts!inner ( id, name, organization_id ),
      profiles:learner_id ( full_name, email )
    `)
    .eq('cohorts.organization_id', organizationId);

  if (cohortId) query = query.eq('cohort_id', cohortId);

  const { data, error } = await query;
  if (error) throw new Error(`getOrgLearners: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    userId:           row.learner_id,
    fullName:         row.profiles?.full_name ?? null,
    email:            row.profiles?.email ?? '',
    cohortId:         row.cohorts.id,
    cohortName:       row.cohorts.name,
    enrollmentStatus: row.enrollment_status,
    enrolledAt:       row.enrolled_at,
  }));
}

// ─── getOrgProgress ───────────────────────────────────────────────────────────
//
// Aggregated — does NOT loop per learner. Query count is fixed at 5 regardless
// of cohort or learner count:
//   1. cohorts (filter)
//   2. cohort_enrollments (filter)
//   3. courses (course_id lookup)
//   4. course_lessons (total published count)
//   5. lesson_progress + program_completion_certificates (parallel)

export async function getOrgProgress(
  filters: OrgReportFilters
): Promise<OrgProgressSummary> {
  const db = requireDb('getOrgProgress');

  const empty: OrgProgressSummary = {
    organizationId:     filters.organizationId,
    cohortId:           filters.cohortId ?? null,
    totalLearners:      0,
    completedLearners:  0,
    avgProgressPercent: 0,
    certificatesIssued: 0,
  };

  // 1. Resolve cohort IDs for this org
  let cohortQuery = db
    .from('cohorts')
    .select('id, program_id')
    .eq('organization_id', filters.organizationId);

  if (filters.cohortId)  cohortQuery = cohortQuery.eq('id', filters.cohortId);
  if (filters.programId) cohortQuery = cohortQuery.eq('program_id', filters.programId);

  const { data: cohorts, error: cohortErr } = await cohortQuery;
  if (cohortErr) throw new Error(`getOrgProgress/cohorts: ${cohortErr.message}`);

  const cohortIds = (cohorts ?? []).map((c: any) => c.id as string);
  if (!cohortIds.length) return empty;

  // 2. Enrollments (date-filtered if requested)
  let enrollQuery = db
    .from('cohort_enrollments')
    .select('learner_id, enrollment_status')
    .in('cohort_id', cohortIds);

  if (filters.dateFrom) enrollQuery = enrollQuery.gte('enrolled_at', filters.dateFrom);
  if (filters.dateTo)   enrollQuery = enrollQuery.lte('enrolled_at', filters.dateTo);

  const { data: enrollments, error: enrollErr } = await enrollQuery;
  if (enrollErr) throw new Error(`getOrgProgress/enrollments: ${enrollErr.message}`);

  const uniqueLearnerIds = [
    ...new Set((enrollments ?? []).map((e: any) => e.learner_id as string)),
  ];
  if (!uniqueLearnerIds.length) return empty;

  // 3. Resolve course_id from the first cohort's program
  const programId = cohorts?.[0]?.program_id ?? null;
  let courseId: string | null = null;

  if (programId) {
    const { data: tc } = await db
      .from('training_courses')
      .select('id')
      .eq('program_id', programId)
      .maybeSingle();
    courseId = tc?.id ?? null;
  }

  // No course linked — return enrollment count only
  if (!courseId) {
    return { ...empty, totalLearners: uniqueLearnerIds.length };
  }

  // 4 + 5. Parallel: lesson counts, completion rows, certificates
  const [
    { data: allLessons,   error: lessonErr  },
    { data: completedRows, error: progressErr },
    { data: certRows,     error: certErr    },
  ] = await Promise.all([
    db
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_published', true),

    db
      .from('lesson_progress')
      .select('user_id')
      .eq('course_id', courseId)
      .eq('completed', true)
      .in('user_id', uniqueLearnerIds),

    db
      .from('program_completion_certificates')
      .select('user_id')
      .eq('course_id', courseId)
      .in('user_id', uniqueLearnerIds),
  ]);

  if (lessonErr)   throw new Error(`getOrgProgress/lessons: ${lessonErr.message}`);
  if (progressErr) throw new Error(`getOrgProgress/progress: ${progressErr.message}`);
  if (certErr)     throw new Error(`getOrgProgress/certs: ${certErr.message}`);

  const totalLessons = allLessons?.length ?? 0;

  // Completed lesson count per learner
  const completedByLearner = new Map<string, number>();
  for (const row of completedRows ?? []) {
    completedByLearner.set(row.user_id, (completedByLearner.get(row.user_id) ?? 0) + 1);
  }

  const certLearnerIds    = new Set((certRows ?? []).map((r: any) => r.user_id as string));
  const certificatesIssued = certLearnerIds.size;

  let totalProgress    = 0;
  let completedLearners = 0;

  for (const learnerId of uniqueLearnerIds) {
    const done = completedByLearner.get(learnerId) ?? 0;
    const pct  = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
    totalProgress += pct;
    if (pct === 100 && totalLessons > 0) completedLearners++;
  }

  const avgProgressPercent = uniqueLearnerIds.length > 0
    ? Math.round(totalProgress / uniqueLearnerIds.length)
    : 0;

  // credentialStatus='issued' narrows completedLearners to cert holders only
  const effectiveCompleted = filters.credentialStatus === 'issued'
    ? certificatesIssued
    : completedLearners;

  return {
    organizationId:     filters.organizationId,
    cohortId:           filters.cohortId ?? null,
    totalLearners:      uniqueLearnerIds.length,
    completedLearners:  effectiveCompleted,
    avgProgressPercent,
    certificatesIssued,
  };
}
