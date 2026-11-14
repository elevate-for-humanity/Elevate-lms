/**
 * Archetype Registry
 *
 * Complete mapping of all 876 pages to 12 archetypes.
 * Every page MUST map to exactly one archetype.
 */

export enum PageArchetype {
  DASHBOARD = 'DASHBOARD',
  PROGRAM = 'PROGRAM',
  ADMIN_CRUD = 'ADMIN_CRUD',
  PORTAL = 'PORTAL',
  AUTH = 'AUTH',
  POLICY = 'POLICY',
  MARKETING = 'MARKETING',
  APPLICATION = 'APPLICATION',
  COURSE = 'COURSE',
  PARTNER = 'PARTNER',
  DIRECTORY = 'DIRECTORY',
  UTILITY = 'UTILITY',
}

/**
 * Map route pattern to archetype
 */
export function getArchetypeForRoute(route: string): PageArchetype {
  // Dashboard pages
  if (route.includes('/lms/dashboard')) {
    return PageArchetype.DASHBOARD;
  }

  // Program pages
  if (route.match(/\/programs?\/[^/]+$/)) {
    return PageArchetype.PROGRAM;
  }

  // Admin CRUD pages
  if (route.startsWith('/admin/')) {
    return PageArchetype.ADMIN_CRUD;
  }

  // Portal pages
  if (route.includes('/portal/')) {
    return PageArchetype.PORTAL;
  }

  // Auth pages
  if (route.match(/\/(login|signup|auth|verify|reset-password)/)) {
    return PageArchetype.AUTH;
  }

  // Policy pages
  if (route.match(/\/(privacy|terms|policy|legal|compliance)/)) {
    return PageArchetype.POLICY;
  }

  // Marketing pages
  if (route.match(/\/(about|contact|faq|help|support)/)) {
    return PageArchetype.MARKETING;
  }

  // Application pages
  if (route.match(/\/(apply|enroll|register)/)) {
    return PageArchetype.APPLICATION;
  }

  // Course pages
  if (route.match(/\/(courses?|lms|lessons?|modules?)\//)) {
    return PageArchetype.COURSE;
  }

  // Partner pages
  if (route.match(/\/(shop|employer|partner|board|delegate|workforce-board)\//)) {
    return PageArchetype.PARTNER;
  }

  // Directory pages (listings, indexes)
  if (route.match(/\/(programs|courses|opportunities|jobs|directory)$/)) {
    return PageArchetype.DIRECTORY;
  }

  // Utility pages (everything else)
  return PageArchetype.UTILITY;
}

/**
 * Validate that a page has required archetype properties
 */
export function validateArchetypePage(
  archetype: PageArchetype,
  pageProps: {
    hasHero: boolean;
    hasMetadata: boolean;
    hasAuth: boolean;
    hasContent: boolean;
  },
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // All pages must have hero and metadata
  if (!pageProps.hasHero) {
    errors.push('Missing hero section');
  }
  if (!pageProps.hasMetadata) {
    errors.push('Missing metadata (title/description)');
  }
  if (!pageProps.hasContent) {
    errors.push('Missing content sections');
  }

  // Dashboards, portals, admin must have auth
  if (
    [PageArchetype.DASHBOARD, PageArchetype.PORTAL, PageArchetype.ADMIN_CRUD].includes(archetype)
  ) {
    if (!pageProps.hasAuth) {
      errors.push('Missing authentication check');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get archetype requirements
 */
export function getArchetypeRequirements(archetype: PageArchetype) {
  const base = {
    hero: true,
    metadata: true,
    content: true,
    auth: false,
    roleCheck: false,
  };

  switch (archetype) {
    case PageArchetype.DASHBOARD:
    case PageArchetype.PORTAL:
    case PageArchetype.ADMIN_CRUD:
      return { ...base, auth: true, roleCheck: true };

    case PageArchetype.APPLICATION:
      return { ...base, auth: true };

    default:
      return base;
  }
}
