/**
 * Partner routing for approved applications.
 *
 * Called once inside approveApplication() after user_id is resolved.
 * Never call this from admin routes or API handlers directly.
 *
 * Supported routes:
 *   cna        → CMI (Choice Medical Institute, School Code #015188)
 *   ekg        → NHA
 *   phlebotomy → NHA
 *
 * All writes are idempotent:
 *   - Pre-insert existence check (fast path for retries)
 *   - Postgres unique constraint violation (23505) caught and resolved
 *     to the existing row — never surfaces as a 500
 *
 * Every approval emits a structured log entry with a correlation ID
 * so individual approvals are traceable across retries.
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationRow = {
  id: string;
  user_id: string | null;
  program_slug: string | null;
  status: string | null;
};

type PartnerRow = {
  id: string;
  name: string;
  license_number: string | null;
};

type ProgramRow = {
  id: string;
  slug: string;
};

type WriteOutcome = 'created' | 'already_exists';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCmiProgram(slug: string | null | undefined): boolean {
  return slug === 'cna';
}

function isNhaProgram(slug: string | null | undefined): boolean {
  return slug === 'ekg' || slug === 'phlebotomy';
}

async function getPartnerByName(db: SupabaseClient, name: string): Promise<PartnerRow> {
  const { data, error } = await db
    .from('partners')
    .select('id,name,license_number')
    .eq('name', name)
    .maybeSingle();

  if (error) throw new Error(`Failed loading partner "${name}": ${error.message}`);
  if (!data) throw new Error(`Partner "${name}" not found in partners table`);

  return data;
}

async function getProgramBySlug(db: SupabaseClient, slug: string): Promise<ProgramRow> {
  const { data, error } = await db
    .from('programs')
    .select('id,slug')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Failed loading program "${slug}": ${error.message}`);
  if (!data) throw new Error(`Program "${slug}" not found in programs table`);

  return data;
}

// ── Idempotent writes ─────────────────────────────────────────────────────────

async function ensurePartnerEnrollment(params: {
  db: SupabaseClient;
  partnerId: string;
  studentId: string;
  programId: string;
  status: string;
  correlationId: string;
}): Promise<{ id: string; outcome: WriteOutcome }> {
  const { db, partnerId, studentId, programId, status, correlationId } = params;

  // Fast path: check before insert (handles sequential retries cheaply)
  const { data: existing, error: checkErr } = await db
    .from('partner_enrollments')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('student_id', studentId)
    .eq('program_id', programId)
    .maybeSingle();

  if (checkErr) throw new Error(`partner_enrollments check failed: ${checkErr.message}`);

  if (existing) {
    logger.info('[partner-routing] partner_enrollment already exists', {
      correlationId, partnerId, studentId, programId, id: existing.id,
    });
    return { id: existing.id, outcome: 'already_exists' };
  }

  // Insert — catch unique constraint violation (concurrent race)
  try {
    const { data, error } = await db
      .from('partner_enrollments')
      .insert({
        partner_id: partnerId,
        student_id: studentId,
        program_id: programId,
        status,
        enrollment_date: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id, outcome: 'created' };
  } catch (err: any) {
    if (err?.code === '23505') {
      // Another concurrent request won the race — fetch and return existing row
      const { data: raceRow, error: raceErr } = await db
        .from('partner_enrollments')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('student_id', studentId)
        .eq('program_id', programId)
        .single();

      if (raceErr || !raceRow) {
        throw new Error(`partner_enrollment race recovery failed: ${raceErr?.message}`);
      }

      logger.info('[partner-routing] partner_enrollment race resolved', {
        correlationId, partnerId, studentId, programId, id: raceRow.id,
      });
      return { id: raceRow.id, outcome: 'already_exists' };
    }
    throw new Error(`Failed creating partner_enrollment: ${err.message}`);
  }
}

async function ensureCmiStudent(params: {
  db: SupabaseClient;
  applicationId: string;
  userId: string;
  correlationId: string;
}): Promise<{ id: string; outcome: WriteOutcome }> {
  const { db, applicationId, userId, correlationId } = params;

  // Fast path
  const { data: existing, error: checkErr } = await db
    .from('cmi_students')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (checkErr) throw new Error(`cmi_students check failed: ${checkErr.message}`);

  if (existing) {
    logger.info('[partner-routing] cmi_student already exists', {
      correlationId, applicationId, id: existing.id,
    });
    return { id: existing.id, outcome: 'already_exists' };
  }

  // Insert — catch unique constraint violation (concurrent race)
  try {
    const { data, error } = await db
      .from('cmi_students')
      .insert({ application_id: applicationId, user_id: userId, status: 'enrolled' })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id, outcome: 'created' };
  } catch (err: any) {
    if (err?.code === '23505') {
      const { data: raceRow, error: raceErr } = await db
        .from('cmi_students')
        .select('id')
        .eq('application_id', applicationId)
        .single();

      if (raceErr || !raceRow) {
        throw new Error(`cmi_student race recovery failed: ${raceErr?.message}`);
      }

      logger.info('[partner-routing] cmi_student race resolved', {
        correlationId, applicationId, id: raceRow.id,
      });
      return { id: raceRow.id, outcome: 'already_exists' };
    }
    throw new Error(`Failed creating cmi_student: ${err.message}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export type PartnerRoutingResult = {
  correlationId: string;
  route: 'cmi' | 'nha' | 'none';
  partnerEnrollmentId?: string;
  cmiStudentId?: string;
  outcomes: Record<string, WriteOutcome>;
};

export async function attachPartnerRouting(params: {
  db: SupabaseClient;
  application: ApplicationRow;
  /** Optional caller-supplied correlation ID. Generated if not provided. */
  correlationId?: string;
}): Promise<PartnerRoutingResult> {
  const { db, application } = params;
  const correlationId = params.correlationId ?? randomUUID();
  const slug = application.program_slug;

  if (!isCmiProgram(slug) && !isNhaProgram(slug)) {
    return { correlationId, route: 'none', outcomes: {} };
  }

  if (!slug) {
    throw new Error(`Application ${application.id} has no program_slug`);
  }

  if (!application.user_id) {
    throw new Error(
      `Cannot partner-route application ${application.id} (${slug}) without a resolved user_id`,
    );
  }

  const program = await getProgramBySlug(db, slug);

  // ── CNA → CMI ──────────────────────────────────────────────────────────────
  if (isCmiProgram(slug)) {
    const cmi = await getPartnerByName(db, 'Choice Medical Institute');

    const pe = await ensurePartnerEnrollment({
      db, correlationId,
      partnerId: cmi.id,
      studentId: application.user_id,
      programId: program.id,
      status: 'assigned',
    });

    const cs = await ensureCmiStudent({
      db, correlationId,
      applicationId: application.id,
      userId: application.user_id,
    });

    logger.info('[partner-routing] CNA → CMI complete', {
      correlationId,
      applicationId: application.id,
      userId: application.user_id,
      programId: program.id,
      partnerId: cmi.id,
      partnerEnrollmentOutcome: pe.outcome,
      cmiStudentOutcome: cs.outcome,
    });

    return {
      correlationId,
      route: 'cmi',
      partnerEnrollmentId: pe.id,
      cmiStudentId: cs.id,
      outcomes: { partnerEnrollment: pe.outcome, cmiStudent: cs.outcome },
    };
  }

  // ── EKG / Phlebotomy → NHA ─────────────────────────────────────────────────
  const nha = await getPartnerByName(db, 'NHA');

  const pe = await ensurePartnerEnrollment({
    db, correlationId,
    partnerId: nha.id,
    studentId: application.user_id,
    programId: program.id,
    status: 'enrolled',
  });

  logger.info('[partner-routing] NHA complete', {
    correlationId,
    applicationId: application.id,
    userId: application.user_id,
    programId: program.id,
    partnerId: nha.id,
    partnerEnrollmentOutcome: pe.outcome,
  });

  return {
    correlationId,
    route: 'nha',
    partnerEnrollmentId: pe.id,
    outcomes: { partnerEnrollment: pe.outcome },
  };
}
