/**
 * Avatar Route Map
 *
 * Authoritative mapping of routes to avatar behavior.
 * If a route is not mapped, avatar is SILENT.
 *
 * This is the single source of truth for avatar speech decisions.
 */

export type PageType =
  | 'home'
  | 'programIndex'
  | 'programDetail'
  | 'enroll'
  | 'dashboard'
  | 'progress'
  | 'licensing'
  | 'silent';

export type ProgramCategory =
  | 'healthcare'
  | 'trades'
  | 'transportation'
  | 'technology'
  | 'business'
  | 'apprenticeship';

export interface RouteAvatarContext {
  enabled: boolean;
  speakOnLoad: boolean;
  pageType: PageType;
  programName?: string;
  category?: ProgramCategory;
  maxMessages: number;
}

// Silent context - default for unmapped routes
const SILENT: RouteAvatarContext = {
  enabled: false,
  speakOnLoad: false,
  pageType: 'silent',
  maxMessages: 0,
};

// Program category detection from route
function detectCategory(route: string): ProgramCategory | undefined {
  if (
    route.includes('cna') ||
    route.includes('medical') ||
    route.includes('phlebotomy') ||
    route.includes('healthcare')
  ) {
    return 'healthcare';
  }
  if (
    route.includes('barber') ||
    route.includes('cosmetology') ||
    route.includes('esthetician') ||
    route.includes('nail')
  ) {
    return 'apprenticeship';
  }
  if (route.includes('cdl') || route.includes('transportation')) {
    return 'transportation';
  }
  if (
    route.includes('hvac') ||
    route.includes('welding') ||
    route.includes('electrical') ||
    route.includes('plumbing') ||
    route.includes('trades')
  ) {
    return 'trades';
  }
  if (
    route.includes('technology') ||
    route.includes('it-support') ||
    route.includes('cybersecurity') ||
    route.includes('web-dev')
  ) {
    return 'technology';
  }
  if (route.includes('business') || route.includes('tax')) {
    return 'business';
  }
  return undefined;
}

// Extract program name from route
function extractProgramName(route: string): string | undefined {
  const segments = route.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[0] === 'programs') {
    // Convert slug to title case
    const slug = segments[segments.length - 1];
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return undefined;
}

/**
 * Get avatar context for a route
 *
 * This is the ONLY function that determines avatar behavior.
 * All avatar decisions flow through here.
 */
export function getAvatarContextForRoute(route: string): RouteAvatarContext {
  // Normalize route
  const normalizedRoute = route.toLowerCase().replace(/\/$/, '') || '/';

  // ============================================
  // SILENT ZONES (hard block)
  // ============================================

  const silentPatterns = [
    /^\/api/,
    /^\/auth/,
    /^\/login/,
    /^\/signup/,
    /^\/privacy/,
    /^\/terms/,
    /^\/policies/,
    /^\/governance/,
    /^\/accessibility/,
    /^\/assignments/,
    /^\/tests/,
    /^\/quiz/,
    /^\/exam/,
  ];

  if (silentPatterns.some((pattern) => pattern.test(normalizedRoute))) {
    return SILENT;
  }

  // ============================================
  // MARKETING PAGES
  // ============================================

  // Homepage
  if (normalizedRoute === '/') {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'home',
      maxMessages: 1,
    };
  }

  // Programs index
  if (normalizedRoute === '/programs') {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'programIndex',
      maxMessages: 1,
    };
  }

  // Program detail pages
  if (normalizedRoute.startsWith('/programs/') && normalizedRoute !== '/programs') {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'programDetail',
      programName: extractProgramName(normalizedRoute),
      category: detectCategory(normalizedRoute),
      maxMessages: 1,
    };
  }

  // Enrollment / Apply
  if (normalizedRoute.startsWith('/apply') || normalizedRoute.startsWith('/enroll')) {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'enroll',
      maxMessages: 1,
    };
  }

  // WIOA Eligibility
  if (normalizedRoute.includes('wioa') || normalizedRoute.includes('eligibility')) {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'enroll',
      maxMessages: 1,
    };
  }

  // ============================================
  // LMS PAGES
  // ============================================

  // Student portal dashboard
  if (normalizedRoute === '/student-portal' || normalizedRoute === '/student-portal/dashboard') {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'dashboard',
      maxMessages: 1,
    };
  }

  // Progress / Hours tracking
  if (normalizedRoute.includes('/progress') || normalizedRoute.includes('/hours')) {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'progress',
      maxMessages: 1,
    };
  }

  // Other student portal pages - silent (UI is self-explanatory)
  if (normalizedRoute.startsWith('/student-portal/')) {
    return SILENT;
  }

  // Instructor / Staff portals
  if (normalizedRoute.startsWith('/admin/instructor') || normalizedRoute.startsWith('/admin/staff-portal')) {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'dashboard',
      maxMessages: 1,
    };
  }

  // ============================================
  // ENTERPRISE / LICENSING
  // ============================================

  if (
    normalizedRoute.includes('/licenses') ||
    normalizedRoute.includes('/enterprise') ||
    normalizedRoute.includes('/government')
  ) {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'licensing',
      maxMessages: 1,
    };
  }

  // ============================================
  // STORE (mostly silent)
  // ============================================

  if (normalizedRoute === '/store/checkout') {
    return {
      enabled: true,
      speakOnLoad: true,
      pageType: 'enroll', // Same calm, procedural tone
      maxMessages: 1,
    };
  }

  if (normalizedRoute.startsWith('/store')) {
    return SILENT; // Browsing doesn't need narration
  }

  // ============================================
  // DEFAULT: SILENT
  // ============================================

  return SILENT;
}

/**
 * Check if a route should have avatar speech
 */
export function shouldRouteHaveAvatar(route: string): boolean {
  const context = getAvatarContextForRoute(route);
  return context.enabled && context.speakOnLoad;
}

/**
 * Get all routes that should have avatars (for auditing)
 */
export function getAvatarEnabledRoutes(): string[] {
  // This would be populated from your actual route list
  // For now, return the known enabled patterns
  return [
    '/',
    '/programs',
    '/programs/*',
    '/apply',
    '/enroll/*',
    '/wioa-eligibility',
    '/student-portal',
    '/student-portal/progress',
    '/student-portal/hours',
    '/admin/instructor',
    '/admin/staff-portal',
    '/store/licenses/*',
    '/government',
    '/store/checkout',
  ];
}
