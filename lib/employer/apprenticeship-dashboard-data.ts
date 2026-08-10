import { requireAdminClient } from '@/lib/supabase/admin';

export type EmployerApprenticeshipSummary = {
  employerId: string | null;
  mappedProgramCount: number;
  mappedPrograms: Array<{ id: string; slug: string | null; name: string }>;
  availableStandardsCount: number | null;
  sourceState: 'mapped' | 'unmapped' | 'employer-record-missing' | 'unavailable';
  error?: string;
};

/**
 * Employer apprenticeship dashboard source of truth.
 *
 * - employers.owner_user_id identifies the signed-in employer organization.
 * - employer_partnerships is the explicit employer→program mapping.
 * - programs is the public program catalog used by those mappings.
 * - apprenticeship_programs is the larger apprenticeship standards/catalog
 *   layer and is reported separately; it is never treated as if one employer
 *   sponsors every catalog record.
 *
 * `employerId` is an explicit admin-preview context. Callers must authorize the
 * administrator before supplying it; normal employer users are always resolved
 * through owner_user_id.
 */
export async function loadEmployerApprenticeshipSummary(
  userId: string,
  options: { employerId?: string } = {},
): Promise<EmployerApprenticeshipSummary> {
  const db = await requireAdminClient();

  let employerId = options.employerId ?? null;
  if (!employerId) {
    const { data: employer, error: employerError } = await db
      .from('employers')
      .select('id')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (employerError) {
      return {
        employerId: null,
        mappedProgramCount: 0,
        mappedPrograms: [],
        availableStandardsCount: null,
        sourceState: 'unavailable',
        error: employerError.message,
      };
    }
    employerId = employer?.id ?? null;
  }

  const { count: availableStandardsCount, error: standardsError } = await db
    .from('apprenticeship_programs')
    .select('id', { count: 'exact', head: true });

  if (!employerId) {
    return {
      employerId: null,
      mappedProgramCount: 0,
      mappedPrograms: [],
      availableStandardsCount: standardsError ? null : (availableStandardsCount ?? 0),
      sourceState: 'employer-record-missing',
      error: standardsError?.message,
    };
  }

  const { data: mappings, error: mappingError } = await db
    .from('employer_partnerships')
    .select('program_id, status, end_date')
    .eq('employer_id', employerId);

  if (mappingError) {
    return {
      employerId,
      mappedProgramCount: 0,
      mappedPrograms: [],
      availableStandardsCount: standardsError ? null : (availableStandardsCount ?? 0),
      sourceState: 'unavailable',
      error: mappingError.message,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeMappings = (mappings || []).filter((mapping: any) => {
    const status = String(mapping.status || '').toLowerCase();
    const statusAllows = !status || ['active', 'approved', 'current'].includes(status);
    const dateAllows = !mapping.end_date || String(mapping.end_date) >= today;
    return statusAllows && dateAllows;
  });
  const programIds = Array.from(
    new Set(
      activeMappings
        .map((mapping: any) => mapping.program_id)
        .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
    ),
  );

  let mappedPrograms: Array<{ id: string; slug: string | null; name: string }> = [];
  if (programIds.length) {
    const { data: programs, error: programError } = await db
      .from('programs')
      .select('id, slug, name, program_type')
      .in('id', programIds)
      .eq('program_type', 'apprenticeship');

    if (programError) {
      return {
        employerId,
        mappedProgramCount: 0,
        mappedPrograms: [],
        availableStandardsCount: standardsError ? null : (availableStandardsCount ?? 0),
        sourceState: 'unavailable',
        error: programError.message,
      };
    }

    mappedPrograms = (programs || []).map((program: any) => ({
      id: program.id,
      slug: program.slug ?? null,
      name: program.name || program.slug || 'Apprenticeship Program',
    }));
  }

  return {
    employerId,
    mappedProgramCount: mappedPrograms.length,
    mappedPrograms,
    availableStandardsCount: standardsError ? null : (availableStandardsCount ?? 0),
    sourceState: mappedPrograms.length ? 'mapped' : 'unmapped',
    error: standardsError?.message,
  };
}
