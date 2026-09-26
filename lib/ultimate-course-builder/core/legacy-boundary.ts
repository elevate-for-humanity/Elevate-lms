export const FORBIDDEN_ULTIMATE_IMPORT_PREFIXES=['@/lib/course-builder/','@/lib/course-factory/','@/lib/course-video/'] as const;
export function isForbiddenUltimateImport(value:string){return FORBIDDEN_ULTIMATE_IMPORT_PREFIXES.some(prefix=>value.startsWith(prefix));}
