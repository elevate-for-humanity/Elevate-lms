import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const ELEVATE_URL = 'https://www.elevateforhumanity.org';

// Routes that should NOT be in sitemap (auth-gated, private, or separate-domain routes)
const EXCLUDED_PREFIXES = [
  '/admin',
  '/lms',
  '/student',
  '/staff',
  '/staff-portal',
  '/student-portal',
  '/partner-portal',
  '/api',
  '/auth',
  '/login',
  '/signup',
  '/sign',
  '/register',
  '/reset',
  '/reset-password',
  '/verify-email',
  '/verify-identity',
  '/partners/admin',
  '/partners/dashboard',
  '/partners/attendance',
  '/partners/documents',
  '/partners/login',
  '/partners/reports',
  '/partners/students',
  '/partners/support',
  '/org',
  '/docs/ENV',
  '/checkout',
  '/payment',
  '/pay',
  '/invoice',
  '/billing',
  '/demo',
  '/test',
  '/dev',
  '/debug',
  '/settings',
  '/account',
  '/dashboard',
  '/portals',
  '/approvals',
  '/mentor',
  '/reports',
  '/analytics',
  '/performance-report',
  '/cache-diagnostic',
  '/sentry-test',
  '/test-enrollment',
  '/test-images',
  '/unauthorized',
  '/access-paused',
  '/preview',
  '/builder',
  '/studio',
  '/onboarding',
  '/franchise/admin',
  '/franchise/office',
  '/programs/admin',
  '/creator',
  '/instructor',
  '/learner',
  '/employer/dashboard',
  '/employer/settings',
  '/employer/shop',
  '/employer-portal',
  '/program-holder/dashboard',
  '/program-holder/settings',
  '/program-holder/onboarding',
  '/program-holder/verify-identity',
  '/partner/login',
  '/partner/settings',
  '/partner-portal',
  '/partner/onboarding',
  '/pwa',

  '/shop/checkout',
  '/shop/onboarding',
  '/client-portal',
  '/workforce-board',
  '/help/admin',
  // Separate domain — not part of this sitemap
  '/supersonic-fast-cash',
  '/supersonic',
  // Redirect-only routes — canonical URLs are elsewhere
  '/programs/cna-certification',
  '/programs/cdl/waitlist',

  // Portal/role-specific routes — auth-gated, not public content
  '/apprentice',
  '/employee',
  '/partner',          // /partner/* (role portal) — /partners/* (public partner pages) is allowed
  '/program-holder',
  '/compliance',
  '/ferpa',
  '/hub',
  '/leaderboard',
  '/messages',
  '/notifications',
  '/profile',
  '/transcript',
  '/update-password',
  '/verification-approvals',
  '/suboffice-onboarding',
  '/file-manager',
  '/import',
  '/generate',
  '/proctor',
  '/connect',
  '/connects',

  // Internal docs — not public-facing
  '/docs/admins',
  '/docs/api',
  '/docs/lms',
  '/docs/ENV',

  // Community internal pages
  '/community/admins',
  '/community/classroom',
  '/community/developers',

  // Employer portal sub-routes (employer landing page /employer is public)
  '/employer/analytics',
  '/employer/apprenticeships',
  '/employer/candidates',
  '/employer/compliance',
  '/employer/documents',
  '/employer/hours',
  '/employer/jobs',
  '/employer/opportunities',
  '/employer/placements',
  '/employer/post-job',
  '/employer/reports',
  '/employer/verification',

  // Internal-only policy/test pages
  '/policies/disaster-recovery-test',
  '/policies/dr-test-report',

  // Shop internal pages
  '/shop/reports',
  '/shop/seller',
  '/shop/products/new',

  // Enrollment flow pages
  '/enrollment',
  '/enrollment-agreement',
];

// Segments that indicate private routes regardless of position
const EXCLUDED_SEGMENTS = [
  '/dashboard',
  '/settings',
  '/checkout',
  '/onboarding',
  '/login',
  '/signup',
  '/admin',
  '/demo',
];

// Route suffixes that indicate enrollment flows, success pages, or internal actions
const EXCLUDED_SUFFIXES = [
  '/apply',
  '/apply/success',
  '/enroll',
  '/enrollment-success',
  '/enrollment/confirmed',
  '/documents',
  '/documents/upload',
  '/orientation',
  '/curriculum',
  '/course',
  '/host-shops',
  '/timeclock',
  '/transfer-hours',
  '/transfer-hours/request',
  '/hours/log',
  '/hours/history',
  '/hours',
  '/skills',
  '/state-board',
  '/handbook',
  '/sign-mou',
  '/mou',
  '/success',
  '/confirmed',
  '/upload',
  '/my-courses',
  '/competency-test',
  '/analytics',
  '/candidates',
  '/compliance',
  '/placements',
  '/verification',
  '/opportunities',
  '/apprenticeships/new',
  '/products/new',
  '/reports/new',
  '/seller/register',
];

// Priority mapping based on route patterns
function getPriority(route: string): number {
  if (route === '/') return 1.0;
  if (route === '/apply' || route === '/programs') return 1.0;
  if (route.startsWith('/programs/')) return 0.9;
  if (route.startsWith('/apprenticeships')) return 0.9;
  if (route === '/employers' || route === '/how-it-works') return 0.9;
  if (route.startsWith('/about') || route === '/contact') return 0.8;
  if (route.startsWith('/funding') || route.startsWith('/career')) return 0.8;
  // State-specific SEO pages - high priority
  if (route.startsWith('/career-training-')) return 0.9;
  if (route.startsWith('/community-services-')) return 0.9;
  if (route.startsWith('/courses')) return 0.8;
  if (route.startsWith('/store/guides')) return 0.8;
  if (route.startsWith('/blog') || route.startsWith('/resources')) return 0.7;
  if (route.startsWith('/policies') || route.startsWith('/privacy') || route.startsWith('/terms')) return 0.4;
  return 0.6;
}

// Change frequency based on route patterns
function getChangeFreq(route: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (route === '/' || route === '/apply') return 'daily';
  if (route.startsWith('/programs') || route.startsWith('/blog')) return 'weekly';
  // State-specific pages update monthly
  if (route.startsWith('/career-training-') || route.startsWith('/community-services-')) return 'monthly';
  if (route.startsWith('/policies') || route.startsWith('/privacy')) return 'yearly';
  return 'monthly';
}



// Recursively find all page.tsx files
function findAllPages(dir: string, basePath: string = ''): string[] {
  const routes: string[] = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Skip dynamic routes [param] and route groups (name)
        if (item.name.startsWith('[') || item.name.startsWith('_')) continue;
        
        // Handle route groups - strip the parentheses
        let routePart = item.name;
        if (item.name.startsWith('(') && item.name.endsWith(')')) {
          routePart = '';
        }
        
        const newBasePath = routePart ? `${basePath}/${routePart}` : basePath;
        routes.push(...findAllPages(fullPath, newBasePath));
      } else if (item.name === 'page.tsx' || item.name === 'page.ts') {
        routes.push(basePath || '/');
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  
  // Find all pages in the app directory
  const appDir = path.join(process.cwd(), 'app');
  const allRoutes = findAllPages(appDir);
  
  // Filter out excluded routes and deduplicate
  const publicRoutes = [...new Set(allRoutes)]
    .filter(route => {
      // Check prefix exclusions
      if (EXCLUDED_PREFIXES.some(prefix => route.startsWith(prefix))) return false;
      // Check segment exclusions (e.g. /programs/admin, /store/checkout)
      const segments = route.split('/');
      if (segments.some(seg => EXCLUDED_SEGMENTS.includes(`/${seg}`))) return false;
      // Check suffix exclusions — enrollment flows and internal sub-pages
      if (EXCLUDED_SUFFIXES.some(suffix => route.endsWith(suffix))) return false;
      return true;
    })
    .sort();
  
  // Generate sitemap entries — all routes belong to elevateforhumanity.org
  const entries: MetadataRoute.Sitemap = publicRoutes.map(route => ({
    url: `${ELEVATE_URL}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: getChangeFreq(route),
    priority: getPriority(route),
  }));
  
  return entries;
}
