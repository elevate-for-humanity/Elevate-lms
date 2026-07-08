import {
  APPRENTICE_PORTAL_CONFIGS,
  type ApprenticePortalConfig,
} from '@/components/portal/ApprenticePortalShell';

/**
 * Resolves the apprentice sub-nav config for a program slug.
 *
 * Lives here (server-safe module) rather than in ApprenticeSubNav.tsx, which is
 * a 'use client' component. A function exported from a client module cannot be
 * invoked from a server component — doing so crashed the apprentice layout.
 */
export function resolveApprenticeNavConfig(programSlug: string | null): {
  programSlug: string;
  config: ApprenticePortalConfig;
} | null {
  if (!programSlug) return null;
  const config = APPRENTICE_PORTAL_CONFIGS[programSlug];
  if (!config) return null;
  return { programSlug, config };
}
