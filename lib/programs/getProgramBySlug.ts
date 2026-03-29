/**
 * lib/programs/getProgramBySlug.ts
 *
 * Canonical repository for DB-driven program pages.
 * Throws on any missing required data — callers must handle with notFound().
 * No fallbacks. No static file imports.
 */

import { createPublicClient } from '@/lib/supabase/public';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProgramMedia = {
  id: string;
  media_type: 'hero_image' | 'hero_video' | 'gallery_image' | 'thumbnail';
  url: string;
  alt_text: string | null;
  sort_order: number;
};

export type ProgramCTA = {
  id: string;
  cta_type: 'apply' | 'request_info' | 'external' | 'waitlist';
  label: string;
  href: string;
  style_variant: 'primary' | 'secondary' | 'ghost' | 'link';
  is_external: boolean;
  sort_order: number;
};

export type ProgramTrack = {
  id: string;
  track_code: string;
  title: string;
  description: string | null;
  funding_type: 'funded' | 'self_pay' | 'partner' | 'employer_sponsored' | 'other';
  cost_cents: number | null;
  available: boolean;
  coming_soon_message: string | null;
  sort_order: number;
};

export type ProgramLesson = {
  id: string;
  lesson_number: number;
  title: string;
  lesson_type: 'lesson' | 'quiz' | 'lab' | 'exam' | 'orientation';
  duration_minutes: number | null;
  sort_order: number;
};

export type ProgramModule = {
  id: string;
  module_number: number;
  title: string;
  description: string | null;
  lesson_count: number;
  duration_hours: number | null;
  sort_order: number;
  program_lessons: ProgramLesson[];
};

export type ProgramRecord = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  delivery_model: string | null;
  funding: string | null;
  outcomes: string | null;
  requirements: unknown;
  hero_headline: string | null;
  hero_subheadline: string | null;
  length_weeks: number | null;
  certificate_title: string | null;
  published: boolean;
  program_media: ProgramMedia[];
  program_ctas: ProgramCTA[];
  program_tracks: ProgramTrack[];
  program_modules: ProgramModule[];
  /** True only when all required relations (media, CTAs, tracks, modules) are present. */
  isComplete: boolean;
};

// ─── Repository ───────────────────────────────────────────────────────────────

export async function getPublishedProgramBySlug(slug: string): Promise<ProgramRecord> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('programs')
    .select(`
      id,
      slug,
      title,
      short_description,
      description,
      delivery_model,
      funding,
      outcomes,
      requirements,
      hero_headline,
      hero_subheadline,
      length_weeks,
      certificate_title,
      published,
      program_media (
        id,
        media_type,
        url,
        alt_text,
        sort_order
      ),
      program_ctas (
        id,
        cta_type,
        label,
        href,
        style_variant,
        is_external,
        sort_order
      ),
      program_tracks (
        id,
        track_code,
        title,
        description,
        funding_type,
        cost_cents,
        available,
        coming_soon_message,
        sort_order
      ),
      program_modules (
        id,
        module_number,
        title,
        description,
        lesson_count,
        duration_hours,
        sort_order,
        program_lessons (
          id,
          lesson_number,
          title,
          lesson_type,
          duration_minutes,
          sort_order
        )
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) {
    throw new Error(`Published program not found for slug: ${slug}`);
  }

  // Normalise missing relations to empty arrays — page renders a controlled
  // "coming soon" state rather than 404ing or showing empty sections.
  data.program_media   = data.program_media   ?? [];
  data.program_ctas    = data.program_ctas    ?? [];
  data.program_tracks  = data.program_tracks  ?? [];
  data.program_modules = data.program_modules ?? [];

  (data as ProgramRecord).isComplete =
    data.program_media.length > 0 &&
    data.program_ctas.length > 0 &&
    data.program_tracks.length > 0 &&
    data.program_modules.length > 0;

  // Sort all relations by sort_order
  data.program_media.sort((a, b) => a.sort_order - b.sort_order);
  data.program_ctas.sort((a, b) => a.sort_order - b.sort_order);
  data.program_tracks.sort((a, b) => a.sort_order - b.sort_order);
  data.program_modules.sort((a, b) => a.sort_order - b.sort_order);
  for (const mod of data.program_modules) {
    mod.program_lessons?.sort((a, b) => a.sort_order - b.sort_order);
  }

  return data as ProgramRecord;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatTrackCost(cents: number | null): string | null {
  if (cents === null) return null;
  if (cents === 0) return 'Funded';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
