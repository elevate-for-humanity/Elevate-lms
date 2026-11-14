#!/usr/bin/env node

/**
 * Extract public routes from router.tsx for sitemap generation
 * Excludes admin, auth, test, and internal routes
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Read router file
const routerContent = readFileSync(join(ROOT, 'src/router.tsx'), 'utf-8');

// Extract all routes
const routeMatches = routerContent.matchAll(/\{\s*path:\s*'([^']+)'/g);
const allRoutes = Array.from(routeMatches, (m) => m[1]);

// Filter to public routes only
const publicRoutes = allRoutes.filter((route) => {
  // Exclude dynamic routes (contain :)
  if (route.includes(':')) return false;

  // Exclude catch-all
  if (route === '*') return false;

  // Exclude admin routes
  if (route.startsWith('/admin')) return false;

  // Exclude auth routes
  if (route.startsWith('/auth/')) return false;

  // Exclude test routes
  if (route.includes('test')) return false;

  // Exclude generated routes
  if (route.includes('-generated-')) return false;

  // Exclude internal/component routes
  if (route.startsWith('/animated-')) return false;
  if (route.startsWith('/ask-')) return false;
  if (route.startsWith('/asset-')) return false;
  if (route.startsWith('/chart')) return false;
  if (route.startsWith('/chat-')) return false;
  if (route.startsWith('/error-')) return false;
  if (route.startsWith('/footer')) return false;
  if (route.startsWith('/header')) return false;
  if (route.startsWith('/loading-')) return false;
  if (route.startsWith('/nav-')) return false;
  if (route.startsWith('/protected-')) return false;
  if (route.startsWith('/seo')) return false;
  if (route.startsWith('/testimonials')) return false;
  if (route.startsWith('/theme-')) return false;
  if (route.startsWith('/toast')) return false;
  if (route.startsWith('/trust-')) return false;
  if (route.startsWith('/video-')) return false;

  // Exclude old/backup routes
  if (route.includes('-old')) return false;
  if (route.includes('-backup')) return false;
  if (route.includes('durable')) return false;

  // Exclude classroom admin routes
  if (route.startsWith('/classroom/admin')) return false;

  // Exclude instructor internal routes
  if (route.includes('/instructor/instructor-')) return false;

  // Exclude sisters routes (separate site)
  if (route.startsWith('/sisters/')) return false;

  return true;
});

// Remove duplicates and sort
const uniqueRoutes = [...new Set(publicRoutes)].sort();
