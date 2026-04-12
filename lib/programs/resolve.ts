/**
 * resolveProgram — canonical program lookup from free text.
 *
 * Accepts any of: UUID, slug, display name, or program_interest free text.
 * Returns the programs.id UUID, or null if no match.
 *
 * Resolution order (stops at first match):
 *   1. Already a UUID → verify it exists in programs
 *   2. Exact slug match on programs
 *   3. Exact title match (case-insensitive) on programs
 *   4. Alias map (common misspellings / legacy names)
 *   5. Partial title match on programs
 *   6. Exact slug match on courses (legacy fallback)
 *   7. Partial title match on courses (legacy fallback)
 *
 * All callers that resolve program_interest → UUID for enrollment or
 * approval must use this function. Do not write ad-hoc ilike queries.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Maps legacy / misspelled program_interest values to canonical slugs.
// Add entries here when a new alias is discovered — never in route code.
const SLUG_ALIASES: Record<string, string> = {
  // CNA
  'cna certification':                    'cna',
  'cna training':                         'cna',
  'certified nursing assistant':          'cna',
  // HVAC
  'hvac':                                 'hvac-technician',
  'hvac tech':                            'hvac-technician',
  'hvac technician':                      'hvac-technician',
  // Cosmetology
  'cosmetology apprenticeship':           'cosmetology-apprenticeship',
  'cosmetology':                          'cosmetology-apprenticeship',
  'hair stylist esthetician apprenticeship': 'cosmetology-apprenticeship',
  // Barber
  'barber apprenticeship':                'barber-apprenticeship',
  'barber':                               'barber-apprenticeship',
  'barbering':                            'barber-apprenticeship',
  // Medical
  'medical assistant':                    'medical-assistant',
  'phlebotomy':                           'phlebotomy-technician',
  'phlebotomy technician':                'phlebotomy-technician',
  'home health aide':                     'home-health-aide',
  // Business
  'accounting':                           'bookkeeping',
  'bookkeeping':                          'bookkeeping',
  'entrepreneurship':                     'entrepreneurship-small-business',
  'entrepreneurship small business':      'entrepreneurship-small-business',
  // Electrical / trades
  'electrical apprenticeship':            'electrical',
  'plumbing apprenticeship':              'plumbing',
  'welding certification':                'welding',
  'building maintenance':                 'building-maintenance',
  'building maintenance technician':      'building-maintenance',
  // IT
  'it support specialist':                'it-support',
  'it support':                           'it-support',
  'cybersecurity':                        'cybersecurity-analyst',
  'cybersecurity fundamentals':           'cybersecurity-analyst',
  // CDL
  'cdl':                                  'cdl-training',
  'cdl (commercial driver\'s license)':   'cdl-training',
  'commercial driver\'s license':         'cdl-training',
  // Other
  'peer recovery specialist':             'peer-recovery-specialist',
  'drug & alcohol specimen collector':    'drug-alcohol-specimen-collector',
  'emergency health & safety tech':       'emergency-health-safety',
  'public safety reentry specialist':     'public-safety-reentry',
  'direct support professional':          'direct-support-professional',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ResolvedProgram {
  id: string;
  slug: string;
  title: string;
  source: 'uuid' | 'slug' | 'title' | 'alias' | 'partial' | 'course_slug' | 'course_title';
}

export async function resolveProgram(
  db: SupabaseClient,
  input: string | null | undefined,
): Promise<ResolvedProgram | null> {
  if (!input) return null;

  const raw = input.trim();
  const normalized = raw.toLowerCase().replace(/-/g, ' ').trim();

  // ── 1. Already a UUID ────────────────────────────────────────────────────
  if (UUID_RE.test(raw)) {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .eq('id', raw)
      .maybeSingle();
    if (data) return { ...data, source: 'uuid' };
  }

  // ── 2. Exact slug match ──────────────────────────────────────────────────
  const slugified = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .eq('slug', slugified)
      .maybeSingle();
    if (data) return { ...data, source: 'slug' };
  }

  // ── 3. Exact title match (case-insensitive) ──────────────────────────────
  {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .ilike('title', raw)
      .maybeSingle();
    if (data) return { ...data, source: 'title' };
  }

  // ── 4. Alias map → slug lookup ───────────────────────────────────────────
  const aliasSlug = SLUG_ALIASES[normalized];
  if (aliasSlug) {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .eq('slug', aliasSlug)
      .maybeSingle();
    if (data) return { ...data, source: 'alias' };
  }

  // ── 5. Partial title match on programs ───────────────────────────────────
  {
    const { data } = await db
      .from('programs')
      .select('id, slug, title')
      .ilike('title', `%${raw}%`)
      .limit(1)
      .maybeSingle();
    if (data) return { ...data, source: 'partial' };
  }

  // ── 6. Exact slug match on courses (legacy) ──────────────────────────────
  {
    const { data } = await db
      .from('courses')
      .select('id, slug, title')
      .eq('slug', slugified)
      .maybeSingle();
    if (data) return { id: data.id, slug: data.slug ?? slugified, title: data.title, source: 'course_slug' };
  }

  // ── 7. Partial title match on courses (legacy) ───────────────────────────
  {
    const { data } = await db
      .from('courses')
      .select('id, slug, title')
      .ilike('title', `%${raw}%`)
      .limit(1)
      .maybeSingle();
    if (data) return { id: data.id, slug: data.slug ?? slugified, title: data.title, source: 'course_title' };
  }

  return null;
}

/** Convenience wrapper — returns just the UUID or null. */
export async function resolveProgramId(
  db: SupabaseClient,
  input: string | null | undefined,
): Promise<string | null> {
  const result = await resolveProgram(db, input);
  return result?.id ?? null;
}
