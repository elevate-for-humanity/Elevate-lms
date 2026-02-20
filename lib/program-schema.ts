
// =====================================================
// PROGRAM SCHEMA ENFORCEMENT
// Prevents program entropy and ensures consistency
// =====================================================

import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type Modality = 'ONLINE' | 'IN_PERSON' | 'HYBRID';
export type FundingType = 'WIOA' | 'STATE' | 'EMPLOYER' | 'SELF_PAY';

export interface ProgramSchema {
  id?: string;
  title: string;
  status: ProgramStatus;
  modality: Modality;
  duration_weeks: number;
  prerequisites: string;
  funding_types: FundingType[];
  description: string;
  region?: string;
  eligibility_notes?: string;
  published?: boolean;
  archived_at?: string | null;
}

/**
 * Required fields for program publication
 */
const REQUIRED_FIELDS_FOR_PUBLISH: (keyof ProgramSchema)[] = [
  'title',
  'modality',
  'duration_weeks',
  'prerequisites',
  'funding_types',
  'description',
];

/**
 * Validate program schema before publish
 */
export function validateProgramForPublish(program: Partial<ProgramSchema>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS_FOR_PUBLISH) {
    if (!program[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate duration
  if (program.duration_weeks && program.duration_weeks < 1) {
    errors.push('Duration must be at least 1 week');
  }

  // Validate funding types
  if (program.funding_types && program.funding_types.length === 0) {
    errors.push('At least one funding type must be specified');
  }

  // Validate modality
  if (program.modality && !['ONLINE', 'IN_PERSON', 'HYBRID'].includes(program.modality)) {
    errors.push('Invalid modality');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Publish a program (moves from DRAFT to ACTIVE)
 */
export async function publishProgram(programId: string, publishedBy: string) {
  const supabase = await createServerSupabaseClient();

  // Get program
  const { data: program, error: fetchError } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (fetchError || !program) {
    throw new Error('Program not found');
  }

  // Validate
  const validation = validateProgramForPublish(program);
  if (!validation.valid) {
    throw new Error(`Cannot publish: ${validation.errors.join(', ')}`);
  }

  // Update status
  const { data: updated, error: updateError } = await supabase
    .from('programs')
    .update({
      status: 'ACTIVE',
      published: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to publish program', { error: updateError, programId });
    throw new Error('Failed to publish program');
  }

  // Log publication
  await supabase.from('audit_logs').insert({
    event_type: 'program_published',
    resource_type: 'program',
    resource_id: programId,
    user_id: publishedBy,
    metadata: {
      title: program.title,
    },
  });

  logger.info('Program published', { programId, publishedBy });

  return updated;
}

/**
 * Archive a program
 */
export async function archiveProgram(programId: string, archivedBy: string) {
  const supabase = await createServerSupabaseClient();

  const { data: program, error } = await supabase
    .from('programs')
    .update({
      status: 'ARCHIVED',
      archived_at: new Date().toISOString(),
      published: false,
    })
    .eq('id', programId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to archive program', { error, programId });
    throw new Error('Failed to archive program');
  }

  // Log archival
  await supabase.from('audit_logs').insert({
    event_type: 'program_archived',
    resource_type: 'program',
    resource_id: programId,
    user_id: archivedBy,
  });

  logger.info('Program archived', { programId, archivedBy });

  return program;
}

/**
 * Get active programs only
 */
export async function getActivePrograms() {
  const supabase = await createServerSupabaseClient();

  const { data: programs, error } = await supabase
    .from('programs')
    .select('*')
    .eq('status', 'ACTIVE')
    .eq('published', true)
    .is('archived_at', null)
    .order('title');

  if (error) {
    logger.error('Failed to fetch active programs', { error });
    throw new Error('Failed to fetch programs');
  }

  return programs;
}

/**
 * Link credential to program and course
 */
export async function linkCredentialToProgram(params: {
  credentialId: string;
  programId: string;
  courseId?: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: credential, error } = await supabase
    .from('credentials')
    .update({
      program_id: params.programId,
      course_id: params.courseId,
    })
    .eq('id', params.credentialId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to link credential to program', { error, params });
    throw new Error('Failed to link credential');
  }

  logger.info('Credential linked to program', params);

  return credential;
}

/**
 * Get program lifecycle status
 */
export function getProgramLifecycleStatus(program: ProgramSchema): {
  canPublish: boolean;
  canArchive: boolean;
  status: string;
  issues: string[];
} {
  const validation = validateProgramForPublish(program);

  return {
    canPublish: program.status === 'DRAFT' && validation.valid,
    canArchive: program.status === 'ACTIVE',
    status: program.status,
    issues: validation.errors,
  };
}
