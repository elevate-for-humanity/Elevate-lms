/**
 * Canonical course types and mappers.
 *
 * Normalizes raw `training_courses` rows. The DB has both `title` and
 * `course_name` columns due to schema drift — the mapper resolves that once.
 */

// ── Raw DB shape ──────────────────────────────────────────────────────────

export interface RawCourseRow {
  id: string;
  title: string | null;
  course_name: string | null; // legacy column, same semantic as title
  slug: string | null;
  description: string | null;
  status: string | null;
  category: string | null;
  duration_hours: number | null;
  duration_minutes: number | null;
  is_published: boolean | null;
  is_active: boolean | null;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ── Canonical type ────────────────────────────────────────────────────────

export type CourseStatus = 'draft' | 'published' | 'archived' | 'review';

export interface CourseRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: CourseStatus;
  category: string | null;
  durationHours: number | null;
  durationMinutes: number | null;
  isPublished: boolean;
  isActive: boolean;
  thumbnailUrl: string | null;
}

// ── Normalizers ───────────────────────────────────────────────────────────

const VALID_STATUSES: CourseStatus[] = ['draft', 'published', 'archived', 'review'];

function normalizeCourseStatus(raw: string | null, isPublished: boolean | null): CourseStatus {
  if (raw && (VALID_STATUSES as string[]).includes(raw)) {
    return raw as CourseStatus;
  }
  // Fall back to published/draft based on is_published flag
  return isPublished ? 'published' : 'draft';
}

// ── Mapper ────────────────────────────────────────────────────────────────

export function mapCourseRow(row: RawCourseRow): CourseRecord {
  // Resolve title: prefer `title`, fall back to `course_name`, then sentinel
  const title = row.title?.trim() || row.course_name?.trim() || 'Untitled Course';
  const isPublished = row.is_published ?? false;

  return {
    id: row.id,
    title,
    slug: row.slug ?? row.id,
    description: row.description ?? '',
    status: normalizeCourseStatus(row.status, isPublished),
    category: row.category ?? null,
    durationHours: row.duration_hours ?? null,
    durationMinutes: row.duration_minutes ?? null,
    isPublished,
    isActive: row.is_active ?? true,
    thumbnailUrl: row.thumbnail_url ?? null,
  };
}
