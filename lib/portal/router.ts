/**
 * Portal Router
 *
 * Single source of truth for field-based portal routing.
 *
 * Architecture:
 *   login → resolvePortalForUser() → portal path → redirect
 *
 * Resolution order (fastest first):
 *   1. profiles.portal_type (cached — single row lookup)
 *   2. active program_enrollment → programs.program_type + category (derive + cache)
 *   3. fallback → /learner/dashboard
 *
 * Adding a new portal:
 *   1. Add the portal key to PortalKey
 *   2. Add its path to PORTAL_PATHS
 *   3. Add category/program_type mappings to CATEGORY_TO_PORTAL and PROGRAM_TYPE_TO_PORTAL
 *   4. Create app/portal/[key]/page.tsx
 *   5. Add the route prefix to proxy.ts PROTECTED_ROUTES
 */

import type { SupabaseClient } from '@/lib/supabase'

// ── Portal registry ───────────────────────────────────────────────────────────

export type PortalKey =
  | 'apprentice'
  | 'healthcare'
  | 'technology'
  | 'business'
  | 'beauty'
  | 'trades'
  | 'social-services'
  | 'hospitality'
  | 'jri'

/** Canonical URL path for each portal. */
export const PORTAL_PATHS: Record<PortalKey, string> = {
  'apprentice':     '/portal/apprentice',
  'healthcare':     '/portal/healthcare',
  'technology':     '/portal/technology',
  'business':       '/portal/business',
  'beauty':         '/portal/beauty',
  'trades':         '/portal/trades',
  'social-services':'/portal/social-services',
  'hospitality':    '/portal/hospitality',
  'jri':            '/portal/jri',
}

/** Fallback when no portal matches. */
export const PORTAL_FALLBACK = '/learner/dashboard'

// ── Mapping tables ────────────────────────────────────────────────────────────

/**
 * program_type → portal key.
 * 'apprenticeship' always wins regardless of category.
 */
const PROGRAM_TYPE_TO_PORTAL: Record<string, PortalKey> = {
  apprenticeship: 'apprentice',
}

/**
 * programs.category (normalised to lowercase) → portal key.
 * Used when program_type is 'classroom', 'certification', or 'bootcamp'.
 */
const CATEGORY_TO_PORTAL: Record<string, PortalKey> = {
  // beauty / barber
  beauty:            'beauty',
  'barber & beauty': 'beauty',

  // healthcare
  healthcare:        'healthcare',
  'social services': 'social-services',

  // technology
  technology:        'technology',

  // business
  business:          'business',

  // trades (non-apprenticeship)
  trades:            'trades',

  // hospitality
  hospitality:       'hospitality',

  // JRI / special workforce readiness
  special:           'jri',
}

// ── Core resolver ─────────────────────────────────────────────────────────────

/**
 * Resolves the portal path for a user.
 *
 * Uses the cached profiles.portal_type first. If missing, derives it from
 * the user's most recent active enrollment, caches the result, and returns
 * the portal path.
 *
 * Always returns a valid redirect path — never throws.
 */
export async function resolvePortalForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  try {
    // ── 1. Check cached portal_type on profile ────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('portal_type')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.portal_type) {
      const path = PORTAL_PATHS[profile.portal_type as PortalKey]
      if (path) return path
    }

    // ── 2. Derive from active enrollment ─────────────────────────────────
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('program_id')
      .eq('user_id', userId)
      .eq('enrollment_state', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!enrollment?.program_id) return PORTAL_FALLBACK

    const { data: program } = await supabase
      .from('programs')
      .select('program_type, category')
      .eq('id', enrollment.program_id)
      .maybeSingle()

    if (!program) return PORTAL_FALLBACK

    const portalKey = derivePortalKey(program.program_type, program.category)
    if (!portalKey) return PORTAL_FALLBACK

    // ── 3. Cache the result on the profile ───────────────────────────────
    await supabase
      .from('profiles')
      .update({ portal_type: portalKey })
      .eq('id', userId)

    return PORTAL_PATHS[portalKey]
  } catch {
    // Never block login on a routing error
    return PORTAL_FALLBACK
  }
}

/**
 * Pure function — maps program_type + category to a PortalKey.
 * Returns null if no portal matches (caller falls back to /learner/dashboard).
 */
export function derivePortalKey(
  programType: string | null | undefined,
  category: string | null | undefined,
): PortalKey | null {
  // program_type takes priority — apprenticeship always → apprentice portal
  if (programType) {
    const byType = PROGRAM_TYPE_TO_PORTAL[programType]
    if (byType) return byType
  }

  // Fall through to category mapping
  if (category) {
    const normalised = category.toLowerCase().trim()
    const byCat = CATEGORY_TO_PORTAL[normalised]
    if (byCat) return byCat
  }

  return null
}

/**
 * Sets portal_type on a profile when a new enrollment is created/activated.
 * Call this from provision-account.ts and the checkout webhook.
 * No-op if the program has no portal mapping.
 */
export async function cachePortalTypeForEnrollment(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
): Promise<void> {
  try {
    const { data: program } = await supabase
      .from('programs')
      .select('program_type, category, slug')
      .eq('id', programId)
      .maybeSingle()

    if (!program) return

    const portalKey = derivePortalKey(program.program_type, program.category, program.slug)
    if (!portalKey) return

    await supabase
      .from('profiles')
      .update({ portal_type: portalKey })
      .eq('id', userId)
  } catch {
    // Non-fatal — portal_type is a cache, not a gate
  }
}
