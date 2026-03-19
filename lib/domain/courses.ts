/**
 * Canonical course types and mapper.
 *
 * Reads from the canonical `courses` table only.
 * `course_name` and `training_courses` are legacy — do not add them back.
 */

// ── Raw DB shape (canonical `courses` table) ──────────────────────────────

export interface RawCourseRow {
  id: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  status: string | null;
  is_active: boolean | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Optional fields present on some selects
  program_id?: string | null;
  thumbnail_url?: string | null;
}

// ── Canonical type ────────────────────────────────────────────────────────

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  status: CourseStatus;
  isActive: boolean;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  programId: string | null;
}

// ── Mapper ────────────────────────────────────────────────────────────────

const VALID_STATUSES: CourseStatus[] = ['draft', 'published', 'archived'];

export function mapCourseRow(row: RawCourseRow): CourseRecord {
  const status: CourseStatus =
    row.status && (VALID_STATUSES as string[]).includes(row.status)
      ? (row.status as CourseStatus)
      : 'draft';

  return {
    id:               row.id,
    title:            row.title?.trim() || 'Untitled Course',
    slug:             row.slug ?? row.id,
    description:      row.description ?? '',
    shortDescription: row.short_description ?? null,
    status,
    isActive:         row.is_active ?? true,
    publishedAt:      row.published_at ?? null,
    thumbnailUrl:     row.thumbnail_url ?? null,
    programId:        row.program_id ?? null,
  };
}
