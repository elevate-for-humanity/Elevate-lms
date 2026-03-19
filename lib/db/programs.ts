/**
 * lib/db/programs.ts — Canonical DB-driven program data layer.
 *
 * Single source of truth for program reads. All program pages, enrollment
 * routes, and CTA logic must use these functions — not static data files.
 *
 * Table mapping (live DB → spec names):
 *   programs            → programs          (same)
 *   program_funding     → program_funding   (new, added in migration 20260503000005)
 *   training_courses    → courses           (live name differs from spec)
 *   partner_lms_providers → partner_providers
 *   partner_lms_courses   → partner_courses
 *   partner_course_mappings → program_partner_courses
 *
 * IMPORTANT: migration 20260503000005 must be applied in Supabase Dashboard
 * before delivery_model, enrollment_type, has_lms_course, and program_funding
 * are available. Until then, those fields return null/empty and the code
 * falls back gracefully.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { DeliveryModel, FundingType, EnrollmentType } from '@/lib/programs/program-schema';

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
  // Phase 3 columns (added in migration 20260503000005)
  delivery_model: string | null;
  enrollment_type: EnrollmentType | null;
  external_enrollment_url: string | null;
  has_lms_course: boolean | null;
  // Relations
  program_funding: ProgramFunding[];
  training_courses: ProgramCourse[];
}

// ─── DB client helper ─────────────────────────────────────────────────────────

async function getDb() {
  const admin = createAdminClient();
  if (admin) return admin;
  return await createClient();
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch a single published program by slug, including funding options
 * and attached LMS courses.
 *
 * Throws if the program is not found or not published.
 * Callers should catch and handle with notFound() or a user-facing error.
 */
export async function getProgramBySlug(slug: string): Promise<DbProgram> {
  const db = await getDb();

  const { data, error } = await db
    .from('programs')
    .select(`
      id, slug, title, description, short_description,
      image_url, hero_image_url, estimated_weeks,
      credential_name, funding_tags, wioa_approved,
      published, is_active, status, featured, display_order,
      delivery_model, enrollment_type, external_enrollment_url, has_lms_course,
      program_funding(id, type, label, is_active),
      training_courses(id, slug, title, published)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) throw new Error(`DB error fetching program '${slug}': ${error.message}`);
  if (!data) throw new Error(`Program not found: '${slug}'`);

  return data as DbProgram;
}

/**
 * Fetch all published, active programs for catalog display.
 * Returns lightweight rows — no funding or course relations.
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
 * Validate a loaded program's DB state.
 * Throws with a specific message for each integrity violation.
 * Call this inside program loaders — not in UI components.
 */
export function validateDbProgram(program: DbProgram): void {
  if (!program.slug) {
    throw new Error(`Program ${program.id} is missing a slug`);
  }

  const type = program.enrollment_type ?? 'internal';

  if (type === 'internal' && program.has_lms_course && program.training_courses.length === 0) {
    throw new Error(
      `Program '${program.slug}' is marked has_lms_course=true but has no attached training_courses row`
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
 * Mirrors getPrimaryCTA() in program-schema.ts but operates on DbProgram.
 * Returns null only when no valid destination can be determined.
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
    href: `/programs/${program.slug}/apply`,
    external: false,
  };
}
