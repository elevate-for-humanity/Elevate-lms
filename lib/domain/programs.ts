/**
 * Canonical program types and mappers.
 *
 * Normalizes raw `programs` table rows. The DB has both `name` and `title`
 * columns due to schema drift — the mapper resolves that once.
 * Null handling and status defaults live here.
 */

// ── Raw DB shape ──────────────────────────────────────────────────────────

export interface RawProgramRow {
  id: string;
  name: string | null;
  title: string | null;           // some rows use title instead of name
  slug: string | null;
  code: string | null;
  description: string | null;
  status: string | null;
  program_type: string | null;
  category: string | null;
  duration_weeks: number | null;
  estimated_weeks: number | null; // legacy alias for duration_weeks
  estimated_hours: number | null;
  cohort_size: number | null;
  service_area: string | null;
  funding_sources: string[] | null;
  is_active: boolean | null;
  completion_criteria: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

// ── Canonical type ────────────────────────────────────────────────────────

export type ProgramStatus = 'draft' | 'published' | 'active' | 'archived';

export interface ProgramRecord {
  id: string;
  /** Resolved from `title` ?? `name` ?? sentinel */
  title: string;
  slug: string;
  code: string | null;
  description: string;
  status: ProgramStatus;
  category: string | null;
  programType: string | null;
  /** Resolved from `duration_weeks` ?? `estimated_weeks` */
  durationWeeks: number | null;
  estimatedHours: number | null;
  cohortSize: number | null;
  serviceArea: string | null;
  fundingSources: string[];
  isActive: boolean;
  completionCriteria: Record<string, unknown>;
}

// ── Normalizers ───────────────────────────────────────────────────────────

const VALID_STATUSES: ProgramStatus[] = ['draft', 'published', 'active', 'archived'];

function normalizeProgramStatus(raw: string | null): ProgramStatus {
  if (raw && (VALID_STATUSES as string[]).includes(raw)) {
    return raw as ProgramStatus;
  }
  return 'draft';
}

// ── Mapper ────────────────────────────────────────────────────────────────

export function mapProgramRow(row: RawProgramRow): ProgramRecord {
  // Resolve title: prefer `title`, fall back to `name`, then sentinel
  const title = row.title?.trim() || row.name?.trim() || 'Untitled Program';

  return {
    id: row.id,
    title,
    slug: row.slug ?? row.code ?? row.id,
    code: row.code ?? null,
    description: row.description ?? '',
    status: normalizeProgramStatus(row.status),
    category: row.category ?? null,
    programType: row.program_type ?? null,
    durationWeeks: row.duration_weeks ?? row.estimated_weeks ?? null,
    estimatedHours: row.estimated_hours ?? null,
    cohortSize: row.cohort_size ?? null,
    serviceArea: row.service_area ?? null,
    fundingSources: row.funding_sources ?? [],
    isActive: row.is_active ?? true,
    completionCriteria: row.completion_criteria ?? {},
  };
}
