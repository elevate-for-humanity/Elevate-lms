/**
 * Canonical production hosting identifiers.
 * Elevate LMS + Admin run on Northflank only (see Dockerfile.northflank-*).
 */
export const PRODUCTION_HOSTING_PLATFORM = 'northflank' as const;

export type ProductionHostingPlatform = typeof PRODUCTION_HOSTING_PLATFORM;

/** Runtime label for diagnostics (/api/build, health metadata). */
export function getProductionHostingPlatform(): ProductionHostingPlatform {
  return PRODUCTION_HOSTING_PLATFORM;
}

/** Northflank service IDs (project elevate-platform). */
export const NORTHFLANK_SERVICES = {
  lms: 'elevate-lms',
  admin: 'elevate-admin',
} as const;
