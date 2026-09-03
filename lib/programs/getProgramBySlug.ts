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

  // Fetch core program fields first — fast, no joins
  const { data, error } = await supabase
    .from('programs')
    .select(
      `
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
      published
    `,
    )
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Published program not found for slug: ${slug}`);
  }

  // Fetch relations in parallel — flat queries are faster than deep nested joins
  const [mediaRes, ctasRes, tracksRes, modulesRes] = await Promise.all([
    supabase
      .from('program_media')
      .select('id,media_type,url,alt_text,sort_order')
      .eq('program_id', data.id),
    supabase
      .from('program_ctas')
      .select('id,cta_type,label,href,style_variant,is_external,sort_order')
      .eq('program_id', data.id),
    supabase
      .from('program_tracks')
      .select(
        'id,track_code,title,description,funding_type,cost_cents,available,coming_soon_message,sort_order',
      )
      .eq('program_id', data.id),
    supabase
      .from('program_modules')
      .select('id,module_number,title,description,lesson_count,duration_hours,sort_order')
      .eq('program_id', data.id),
  ]);

  // Fetch lessons for all modules in one query
  const moduleIds = (modulesRes.data ?? []).map((m: any) => m.id);
  const lessonsRes =
    moduleIds.length > 0
      ? await supabase
          .from('program_lessons')
          .select('id,module_id,lesson_number,title,lesson_type,duration_minutes,sort_order')
          .in('module_id', moduleIds)
      : { data: [] };

  // Attach lessons to their modules
  type LessonRow = ProgramLesson & { module_id: string };
  const lessonsByModule = new Map<string, ProgramLesson[]>();
  for (const lesson of (lessonsRes.data ?? []) as LessonRow[]) {
    const { module_id, ...rest } = lesson;
    const arr = lessonsByModule.get(module_id) ?? [];
    arr.push(rest);
    lessonsByModule.set(module_id, arr);
  }

  const program: ProgramRecord = {
    ...data,
    program_media: (mediaRes.data ?? []) as ProgramMedia[],
    program_ctas: (ctasRes.data ?? []) as ProgramCTA[],
    program_tracks: (tracksRes.data ?? []) as ProgramTrack[],
    program_modules: ((modulesRes.data ?? []) as Omit<ProgramModule, 'program_lessons'>[]).map(
      (m) => ({
        ...m,
        program_lessons: lessonsByModule.get(m.id) ?? [],
      }),
    ),
    isComplete: false,
  };

  // Normalise missing relations to empty arrays — page renders a controlled
  // unavailable state rather than 404ing or showing empty sections.
  program.program_media = program.program_media ?? [];
  program.program_ctas = program.program_ctas ?? [];
  program.program_tracks = program.program_tracks ?? [];
  program.program_modules = program.program_modules ?? [];

  program.isComplete =
    program.program_media.length > 0 &&
    program.program_ctas.length > 0 &&
    program.program_tracks.length > 0 &&
    program.program_modules.length > 0;

  // Sort all relations by sort_order
  program.program_media.sort((a, b) => a.sort_order - b.sort_order);
  program.program_ctas.sort((a, b) => a.sort_order - b.sort_order);
  program.program_tracks.sort((a, b) => a.sort_order - b.sort_order);
  program.program_modules.sort((a, b) => a.sort_order - b.sort_order);
  for (const mod of program.program_modules) {
    mod.program_lessons?.sort((a, b) => a.sort_order - b.sort_order);
  }

  return program;
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
