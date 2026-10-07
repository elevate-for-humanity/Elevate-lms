/** Canonical production hosting identifiers. Google Cloud is the sole production compute authority. */
export const PRODUCTION_HOSTING_PLATFORM='google-cloud' as const;
export type ProductionHostingPlatform=typeof PRODUCTION_HOSTING_PLATFORM;
export function getProductionHostingPlatform():ProductionHostingPlatform{return PRODUCTION_HOSTING_PLATFORM}
export const GOOGLE_SERVICES={marketing:'elevate-marketing-migration',lms:'elevate-lms-migration',admin:'elevate-admin-migration',store:'elevate-store-migration',courseBuilder:'elevate-course-builder',studioBrowser:'elevate-studio-browser'} as const;
