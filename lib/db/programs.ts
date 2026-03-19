/**
 * lib/db/programs.ts — Canonical DB-driven program data layer.
 *
 * DATABASE is the source of truth. These functions throw on failure — they do
 * not fall back to static files. Callers must handle errors with notFound()
 * or an explicit error boundary.
 *
 * Table mapping (live DB slugs differ from canonical slugs in some cases):
 *   Canonical slug              → Live DB slug
 *   peer-recovery-specialist    → peer-recovery-specialist-jri
 *   cna                         → cna-cert
 *   cpr-first-aid               → cpr-cert
 *   business                    → business-startup
 *
 * All other canonical slugs match the DB directly.
 *
 * Requires migration 20260503000005 (delivery_model, enrollment_type,
 * has_lms_course, program_funding table).
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { DeliveryModel, FundingType, EnrollmentType } from '@/lib/programs/program-schema';

// ─── Slug normalization ───────────────────────────────────────────────────────

/**
 * Maps canonical slugs used in URLs/code to the actual slug stored in the DB.
 * Only entries that differ are listed — all others pass through unchanged.
 */
const CANONICAL_TO_DB_SLUG: Record<string, string> = {
  'peer-recovery-specialist': 'peer-recovery-specialist-jri',
  'cna':                      'cna-cert',
  'cpr-first-aid':            'cpr-cert',
  'business':                 'business-startup',
};

export function toDbSlug(canonicalSlug: string): string {
  return CANONICAL_TO_DB_SLUG[canonicalSlug] ?? canonicalSlug;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgramFunding {
  id: string;
  type: FundingType;
  label: string | null;
  is_active: boolean;
}

export interface ProgramCourse {
  id: string;
  slug: string;
  title: string;
  published: boolean;
}

export interface ProgramCurriculumModule {
  id: string;
  title: string;
  topics: string[];
  module_order: number;
}

export interface ProgramEnrollmentTrack {
  id: string;
  track_type: 'funded' | 'self_pay' | 'employer_paid' | 'partner';
  label: string;
  requirement: string | null;
  cost: string | null;
  description: string | null;
  apply_href: string | null;
  available: boolean;
  coming_soon_msg: string | null;
  track_order: number;
}

export interface ProgramCTAs {
  apply_href: string | null;
  enroll_href: string | null;
  request_info_href: string | null;
  career_connect_href: string | null;
  advisor_href: string | null;
  course_href: string | null;
}

export interface ProgramMedia {
  hero_image: string | null;
  hero_image_alt: string | null;
  video_src: string | null;
  voiceover_src: string | null;
  thumbnail: string | null;
  badge_text: string | null;
  badge_color: string | null;
}

export interface DbProgram {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  estimated_weeks: number | null;
  credential_name: string | null;
  funding_tags: string[] | null;
  wioa_approved: boolean | null;
  published: boolean;
  is_active: boolean;
  status: string | null;
  featured: boolean | null;
  display_order: number | null;
  delivery_model: string | null;
  enrollment_type: EnrollmentType | null;
  external_enrollment_url: string | null;
  has_lms_course: boolean | null;
  // Relations
  program_funding: ProgramFunding[];
  training_courses: ProgramCourse[];
  program_curriculum_modules: ProgramCurriculumModule[];
  program_enrollment_tracks: ProgramEnrollmentTrack[];
  program_ctas: ProgramCTAs | null;
  program_media: ProgramMedia | null;
  program_outcomes: { outcome: string; outcome_order: number }[];
  program_requirements: { requirement: string; requirement_order: number }[];
}

// ─── DB client ────────────────────────────────────────────────────────────────

async function getDb() {
  const admin = createAdminClient();
  if (admin) return admin;
  return await createClient();
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch a single published program by slug.
 *
 * Accepts canonical slugs (e.g. 'cna') and resolves them to the live DB slug
 * automatically. Throws — never returns null. Callers must catch and call
 * notFound() or render an error boundary.
 */
export async function getProgramBySlug(slug: string): Promise<DbProgram> {
  const db = await getDb();
  const dbSlug = toDbSlug(slug);

  const { data, error } = await db
    .from('programs')
    .select(`
      id, slug, title, description, short_description,
      image_url, hero_image_url, estimated_weeks,
      credential_name, funding_tags, wioa_approved,
      published, is_active, status, featured, display_order,
      delivery_model, enrollment_type, external_enrollment_url, has_lms_course,
      program_funding(id, type, label, is_active),
      training_courses(id, slug, title, published),
      program_curriculum_modules(id, title, topics, module_order),
      program_enrollment_tracks(id, track_type, label, requirement, cost, description, apply_href, available, coming_soon_msg, track_order),
      program_ctas(apply_href, enroll_href, request_info_href, career_connect_href, advisor_href, course_href),
      program_media(hero_image, hero_image_alt, video_src, voiceover_src, thumbnail, badge_text, badge_color),
      program_outcomes(outcome, outcome_order),
      program_requirements(requirement, requirement_order)
    `)
    .eq('slug', dbSlug)
    .eq('published', true)
    .maybeSingle();

  if (error) throw new Error(`DB error fetching program '${dbSlug}': ${error.message}`);
  if (!data) throw new Error(`Program not found: '${slug}'${dbSlug !== slug ? ` (db slug: '${dbSlug}')` : ''}`);

  return data as DbProgram;
}

/**
 * Fetch all published, active programs for catalog display.
 * Throws on DB error — never returns stale static data.
 */
export async function getPublishedPrograms(): Promise<Omit<DbProgram, 'program_funding' | 'training_courses'>[]> {
  const db = await getDb();

  const { data, error } = await db
    .from('programs')
    .select(`
      id, slug, title, description, short_description,
      image_url, hero_image_url, estimated_weeks,
      credential_name, funding_tags, wioa_approved,
      published, is_active, status, featured, display_order,
      delivery_model, enrollment_type, external_enrollment_url, has_lms_course
    `)
    .eq('published', true)
    .eq('is_active', true)
    .neq('status', 'archived')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (error) throw new Error(`DB error fetching programs: ${error.message}`);

  return (data ?? []) as Omit<DbProgram, 'program_funding' | 'training_courses'>[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a loaded program's DB state. Throws on integrity violations.
 * Call inside program loaders — not in UI components.
 */
export function validateDbProgram(program: DbProgram): void {
  if (!program.slug) {
    throw new Error(`Program ${program.id} is missing a slug`);
  }

  const type = program.enrollment_type ?? 'internal';

  if (type === 'internal' && program.has_lms_course && program.training_courses.length === 0) {
    throw new Error(
      `Program '${program.slug}' has has_lms_course=true but no attached training_courses row`
    );
  }

  if (type === 'external' && !program.external_enrollment_url) {
    throw new Error(
      `Program '${program.slug}' has enrollment_type='external' but no external_enrollment_url`
    );
  }
}

// ─── CTA derivation ───────────────────────────────────────────────────────────

export interface DbPrimaryCTA {
  label: string;
  href: string;
  external: boolean;
}

/**
 * Derive the single primary CTA from DB program state.
 * Returns null only when enrollment_type='external' with no URL set —
 * a data integrity error that validateDbProgram catches first.
 */
export function getDbPrimaryCTA(program: DbProgram): DbPrimaryCTA | null {
  const type = program.enrollment_type ?? 'internal';

  if (type === 'external') {
    if (!program.external_enrollment_url) return null;
    return {
      label: 'Continue to Enrollment',
      href: program.external_enrollment_url,
      external: true,
    };
  }

  if (type === 'waitlist') {
    return {
      label: 'Join Waitlist',
      href: `/programs/${program.slug}/request-info`,
      external: false,
    };
  }

  // internal (default)
  return {
    label: 'Apply Now',
    href: `/apply?program=${program.slug}`,
    external: false,
  };
}
