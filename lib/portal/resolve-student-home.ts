import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveAssignedLearnerHome } from '@/lib/portal/assigned-learner-home';
import { PORTAL_PATHS, PORTAL_FALLBACK, type PortalKey } from '@/lib/portal/router';
import { LMS_HOST } from '@/lib/routing/portal-map';

const LEGACY_APPRENTICE_PORTAL_TYPES = new Set([
  'barber',
  'barber-apprentice',
  'barber_apprentice',
  'cosmetology',
  'cosmetology-apprentice',
  'cosmetology_apprentice',
  'esthetician',
  'nail-technician',
  'nail_technician',
  'culinary',
  'electrical',
  'plumbing',
]);

function appUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${LMS_HOST}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Resolves where a learner should land after login.
 * Apprentices always stay on the LMS host; legacy occupation portals collapse
 * into the single /apprentice runtime.
 */
export async function resolveStudentHomePath(
  supabase: SupabaseClient,
  userId: string,
  cachedPortalType?: string | null,
): Promise<string> {
  const assignedHome = await resolveAssignedLearnerHome(supabase, userId);
  if (assignedHome) return appUrl(assignedHome);

  const cached = String(cachedPortalType || '').trim().toLowerCase();
  if (cached) {
    if (LEGACY_APPRENTICE_PORTAL_TYPES.has(cached)) return appUrl('/apprentice');
    const canonical = PORTAL_PATHS[cached as PortalKey];
    if (canonical) return appUrl(canonical);
  }

  return appUrl(PORTAL_FALLBACK);
}
