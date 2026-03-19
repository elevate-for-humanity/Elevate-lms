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
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

type ApplicationRow = {
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

async function ensurePartnerEnrollment(params: {
  db: SupabaseClient;
  partnerId: string;
  studentId: string;
  programId: string;
  status: string;
}): Promise<string> {
  const { db, partnerId, studentId, programId, status } = params;

  const { data: existing, error: existingErr } = await db
    .from('partner_enrollments')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('student_id', studentId)
    .eq('program_id', programId)
    .maybeSingle();

  if (existingErr) {
    throw new Error(`Failed checking partner_enrollments duplicate: ${existingErr.message}`);
  }

  if (existing) {
    logger.info('[partner-routing] partner_enrollment already exists, skipping', { partnerId, studentId, programId });
    return existing.id;
  }

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

  if (error) throw new Error(`Failed creating partner_enrollment: ${error.message}`);

  return data.id;
}

async function ensureCmiStudent(params: {
  db: SupabaseClient;
  applicationId: string;
  userId: string;
}): Promise<string> {
  const { db, applicationId, userId } = params;

  const { data: existing, error: existingErr } = await db
    .from('cmi_students')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (existingErr) {
    throw new Error(`Failed checking cmi_students duplicate: ${existingErr.message}`);
  }

  if (existing) {
    logger.info('[partner-routing] cmi_student already exists, skipping', { applicationId });
    return existing.id;
  }

  const { data, error } = await db
    .from('cmi_students')
    .insert({
      application_id: applicationId,
      user_id: userId,
      status: 'enrolled',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed creating cmi_student: ${error.message}`);

  return data.id;
}

export async function attachPartnerRouting(params: {
  db: SupabaseClient;
  application: ApplicationRow;
}): Promise<void> {
  const { db, application } = params;
  const slug = application.program_slug;

  if (!isCmiProgram(slug) && !isNhaProgram(slug)) {
    // Not a partner-routed program — nothing to do
    return;
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

  if (isCmiProgram(slug)) {
    const cmi = await getPartnerByName(db, 'Choice Medical Institute');

    await ensurePartnerEnrollment({
      db,
      partnerId: cmi.id,
      studentId: application.user_id,
      programId: program.id,
      status: 'assigned',
    });

    await ensureCmiStudent({
      db,
      applicationId: application.id,
      userId: application.user_id,
    });

    logger.info('[partner-routing] CNA → CMI enrolled', {
      applicationId: application.id,
      userId: application.user_id,
      programId: program.id,
      partnerId: cmi.id,
    });
    return;
  }

  if (isNhaProgram(slug)) {
    const nha = await getPartnerByName(db, 'NHA');

    await ensurePartnerEnrollment({
      db,
      partnerId: nha.id,
      studentId: application.user_id,
      programId: program.id,
      status: 'enrolled',
    });

    logger.info('[partner-routing] NHA enrolled', {
      applicationId: application.id,
      userId: application.user_id,
      programId: program.id,
      partnerId: nha.id,
    });
  }
}
