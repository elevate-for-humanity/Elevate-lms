/**
 * resolveProgram — canonical program lookup from free text.
 *
 * Accepts any of: UUID, slug, display name, or program_interest free text.
 * Returns the programs.id UUID, or null if no match.
 *
 * Resolution order (stops at first match):
 *   1. Already a UUID → verify it exists in programs
 *   2. Exact slug match on programs (canonical + DB slug variants)
 *   3. Exact title match (case-insensitive) on programs
 *   4. Alias map (common misspellings / legacy names)
 *   5. Partial title match on programs
 *   6. Exact slug match on courses (legacy fallback)
 *   7. Partial title match on courses (legacy fallback)
 *
 * All callers that resolve program_interest → UUID for enrollment or
 * approval must use this function. Do not write ad-hoc ilike queries.
 */

import type { SupabaseClient } from '@/lib/supabase';
import {
  SLUG_ALIASES,
  resolveCanonicalSlug,
  toDbSlug,
} from '@/lib/programs/slug';

export { SLUG_ALIASES } from '@/lib/programs/slug';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ResolvedProgram {
  id: string;
  slug: string;
  title: string;
  source: 'uuid' | 'slug' | 'title' | 'alias' | 'partial' | 'course_slug' | 'course_title';
}

async function findProgramBySlug(
  db: SupabaseClient,
  canonicalSlug: string,
): Promise<{ id: string; slug: string; title: string } | null> {
  const dbSlug = toDbSlug(canonicalSlug);
  const slugs = dbSlug === canonicalSlug ? [dbSlug] : [dbSlug, canonicalSlug];
  for (const slug of slugs) {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .eq('slug', slug)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function resolveProgram(
  db: SupabaseClient,
  input: string | null | undefined,
): Promise<ResolvedProgram | null> {
  if (!input) return null;

  const raw = input.trim();
  const normalized = raw.toLowerCase().replace(/-/g, ' ').trim();

  if (UUID_RE.test(raw)) {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .eq('id', raw)
      .maybeSingle();
    if (data) return { ...data, source: 'uuid' };
  }

  const slugified = raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  {
    const data = await findProgramBySlug(db, resolveCanonicalSlug(slugified));
    if (data) return { ...data, source: 'slug' };
  }

  {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .ilike('title', raw)
      .maybeSingle();
    if (data) return { ...data, source: 'title' };
  }

  const aliasSlug = SLUG_ALIASES[normalized];
  if (aliasSlug) {
    const data = await findProgramBySlug(db, aliasSlug);
    if (data) return { ...data, source: 'alias' };
  }

  {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .ilike('title', `%${raw}%`)
      .limit(1)
      .maybeSingle();
    if (data) return { ...data, source: 'partial' };
  }

  {
    const { data } = await db
      .from('courses')
      .select('id, slug, title')
      .eq('slug', slugified)
      .maybeSingle();
    if (data)
      return {
        id: data.id,
        slug: data.slug ?? slugified,
        title: data.title,
        source: 'course_slug',
      };
  }

  {
    const { data } = await db
      .from('courses')
      .select('id, slug, title')
      .ilike('title', `%${raw}%`)
      .limit(1)
      .maybeSingle();
    if (data)
      return {
        id: data.id,
        slug: data.slug ?? slugified,
        title: data.title,
        source: 'course_title',
      };
  }

  return null;
}

export async function resolveProgramId(
  db: SupabaseClient,
  input: string | null | undefined,
): Promise<string | null> {
  const result = await resolveProgram(db, input);
  return result?.id ?? null;
}
