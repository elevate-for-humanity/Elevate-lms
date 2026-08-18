#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'lib/navigation/public-route-registry.ts');
const sitemapPath = path.join(root, 'apps/marketing/app/sitemap.ts');
const humanSitemapPath = path.join(root, 'apps/marketing/app/sitemap/page.tsx');
const robotsPath = path.join(root, 'apps/marketing/app/robots.ts');
const legacyMapPath = path.join(root, 'config/site-map.ts');

const failures = [];
const read = (file) => fs.readFileSync(file, 'utf8');
const requireFile = (file, label) => {
  if (!fs.existsSync(file)) failures.push(`${label} missing: ${path.relative(root, file)}`);
};

requireFile(registryPath, 'Public route registry');
requireFile(sitemapPath, 'XML sitemap');
requireFile(humanSitemapPath, 'Human sitemap');
requireFile(robotsPath, 'Robots policy');
requireFile(legacyMapPath, 'Site-map compatibility export');

if (failures.length === 0) {
  const registry = read(registryPath);
  const sitemap = read(sitemapPath);
  const human = read(humanSitemapPath);
  const robots = read(robotsPath);
  const legacy = read(legacyMapPath);

  const pathMatches = [...registry.matchAll(/\{\s*path:\s*([^,]+),\s*label:/g)].map((match) => match[1].trim());
  const literalPaths = [...registry.matchAll(/\{\s*path:\s*'([^']+)'/g)].map((match) => match[1]);
  const duplicates = literalPaths.filter((value, index) => literalPaths.indexOf(value) !== index);
  if (duplicates.length) failures.push(`Duplicate literal public routes: ${[...new Set(duplicates)].join(', ')}`);

  const privateMarkers = [
    '/admin', '/dashboard', '/lms', '/apprentice', '/host-shop/dashboard', '/host-shop/onboarding',
    '/host-shop/orientation', '/employer/dashboard', '/workforce/dashboard', '/parent-portal',
    '/program-holder/dashboard', '/case-manager/dashboard', '/provider/dashboard', '/workforce-board/dashboard',
  ];
  for (const route of literalPaths) {
    if (privateMarkers.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))) {
      failures.push(`Private route leaked into public registry: ${route}`);
    }
  }

  if (!sitemap.includes('PUBLIC_ROUTE_REGISTRY')) failures.push('XML sitemap is not registry-driven');
  if (!human.includes('publicRouteGroups')) failures.push('Human sitemap is not registry-driven');
  if (!robots.includes('PRIVATE_ROUTE_PREFIXES')) failures.push('robots.ts is not using centralized private-route policy');
  if (!legacy.includes('publicRouteGroups')) failures.push('config/site-map.ts still owns a separate hard-coded route catalog');

  const forbiddenLegacyRoutes = ['/learner/dashboard', '/employers/dashboard', '/builders/course-builder', '/admin/dashboard'];
  for (const stale of forbiddenLegacyRoutes) {
    if (legacy.includes(stale)) failures.push(`Stale route remains in config/site-map.ts: ${stale}`);
  }

  if (pathMatches.length < 25) failures.push(`Public route registry unexpectedly small: ${pathMatches.length} entries`);
}

if (failures.length) {
  console.error('Route/SEO governance check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Route/SEO governance check passed. Public crawl routes and private portal routes have separate canonical ownership.');
