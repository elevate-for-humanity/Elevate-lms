import 'server-only';

export type EmployerProgramMapping = {
  id: string;
  employer_id: string;
  program_id: string;
  status: string | null;
  partnership_type: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type EmployerApprenticeshipProgram = {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  required_hours: number | null;
  duration: string | null;
  status: string | null;
  is_active: boolean | null;
};

export type EmployerDraftProposal = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  duration_months: number | null;
  created_at: string | null;
};

export async function loadEmployerApprenticeshipData(supabase: any, employerId: string) {
  const [mappingResult, catalogResult, draftResult] = await Promise.all([
    supabase
      .from('employer_partnerships')
      .select('id, employer_id, program_id, status, partnership_type, start_date, end_date')
      .eq('employer_id', employerId),
    supabase
      .from('programs')
      .select('id, slug, title, description, required_hours, duration, status, is_active')
      .eq('is_apprenticeship', true)
      .eq('is_active', true)
      .order('title', { ascending: true }),
    supabase
      .from('apprenticeships')
      .select('id, title, description, status, duration_months, created_at')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false }),
  ]);

  if (mappingResult.error) {
    throw new Error(`EMPLOYER_APPRENTICESHIP_MAPPINGS_FAILED:${mappingResult.error.message}`);
  }
  if (catalogResult.error) {
    throw new Error(`EMPLOYER_APPRENTICESHIP_CATALOG_FAILED:${catalogResult.error.message}`);
  }
  if (draftResult.error) {
    throw new Error(`EMPLOYER_APPRENTICESHIP_DRAFTS_FAILED:${draftResult.error.message}`);
  }

  const partnerships = (mappingResult.data ?? []) as EmployerProgramMapping[];
  const availablePrograms = (catalogResult.data ?? []) as EmployerApprenticeshipProgram[];
  const programById = new Map(availablePrograms.map((program) => [program.id, program]));
  const mappedPrograms = partnerships
    .filter((mapping) => !['inactive', 'terminated', 'rejected'].includes(mapping.status ?? ''))
    .map((mapping) => ({ mapping, program: programById.get(mapping.program_id) ?? null }));

  return {
    partnerships,
    mappedPrograms,
    availablePrograms,
    draftProposals: (draftResult.data ?? []) as EmployerDraftProposal[],
  };
}
