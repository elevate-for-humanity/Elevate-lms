import {
  APPRENTICE_PORTAL_CONFIGS,
  type ApprenticePortalConfig,
} from '@/components/portal/ApprenticePortalShell';

/**
 * Resolve one operational apprentice nav. Historical /portal/<trade> values
 * remain only as compatibility routes; Dashboard always returns to /apprentice.
 */
export function resolveApprenticeNavConfig(programSlug: string | null): {
  programSlug: string;
  config: ApprenticePortalConfig;
} | null {
  if (!programSlug) return null;
  const configured = APPRENTICE_PORTAL_CONFIGS[programSlug];
  if (!configured) return null;

  const config: ApprenticePortalConfig = {
    ...configured,
    portalPath: `/apprentice?program=${encodeURIComponent(programSlug)}`,
  };

  return { programSlug, config };
}
