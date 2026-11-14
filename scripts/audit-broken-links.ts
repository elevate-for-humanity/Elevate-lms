#!/usr/bin/env npx tsx
/**
 * Audit for broken internal links across the site
 */

import * as fs from 'fs';
import * as path from 'path';

// Get all page routes
function getAllRoutes(): Set<string> {
  const routes = new Set<string>();

  function scanDir(dir: string, prefix: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip route groups (parentheses)
        const routePart = entry.name.startsWith('(') ? '' : `/${entry.name}`;
        scanDir(fullPath, prefix + routePart);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
        routes.add(prefix || '/');
      }
    }
  }

  scanDir('app');
  return routes;
}

// Extract all href values from a file
function extractLinks(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const links: string[] = [];

  // Match href="/..." patterns
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];
    // Only internal links
    if (href.startsWith('/') && !href.startsWith('//')) {
      // Remove query params and hash
      const cleanHref = href.split('?')[0].split('#')[0];
      links.push(cleanHref);
    }
  }

  return links;
}

// Check if a route exists
function routeExists(href: string, routes: Set<string>): boolean {
  // Exact match
  if (routes.has(href)) return true;

  // Check for dynamic routes (e.g., /programs/[slug])
  const parts = href.split('/').filter(Boolean);

  // Try matching with wildcards
  for (const route of routes) {
    const routeParts = route.split('/').filter(Boolean);
    if (routeParts.length !== parts.length) continue;

    let matches = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith('[') && routeParts[i].endsWith(']')) {
        continue; // Dynamic segment matches anything
      }
      if (routeParts[i] !== parts[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }

  return false;
}

function main() {
  console.log('\n🔍 BROKEN LINK AUDIT\n');
  console.log('='.repeat(60));

  const routes = getAllRoutes();
  console.log(`Found ${routes.size} routes\n`);

  const brokenLinks: { file: string; href: string }[] = [];
  const checkedFiles: string[] = [];

  // Scan all tsx files
  function scanFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next')
        continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanFiles(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        checkedFiles.push(fullPath);
        const links = extractLinks(fullPath);

        for (const href of links) {
          // Skip external, API, and special routes
          if (
            href.startsWith('/api/') ||
            href.startsWith('/_next/') ||
            href.startsWith('/images/') ||
            href.startsWith('/videos/') ||
            href === '/' ||
            href.includes('[') // Dynamic params in href
          )
            continue;

          if (!routeExists(href, routes)) {
            brokenLinks.push({ file: fullPath, href });
          }
        }
      }
    }
  }

  scanFiles('app');
  scanFiles('components');

  console.log(`Checked ${checkedFiles.length} files\n`);

  if (brokenLinks.length === 0) {
    console.log('✅ No broken links found!\n');
  } else {
    console.log(`❌ Found ${brokenLinks.length} potentially broken links:\n`);

    // Group by href
    const byHref = new Map<string, string[]>();
    for (const { file, href } of brokenLinks) {
      if (!byHref.has(href)) byHref.set(href, []);
      byHref.get(href)!.push(file);
    }

    for (const [href, files] of Array.from(byHref.entries()).sort()) {
      console.log(`\n${href}`);
      for (const file of files.slice(0, 3)) {
        console.log(`   └─ ${file}`);
      }
      if (files.length > 3) {
        console.log(`   └─ ... and ${files.length - 3} more`);
      }
    }
  }

  // Save report
  fs.writeFileSync(
    'broken-links-report.json',
    JSON.stringify(
      {
        totalRoutes: routes.size,
        checkedFiles: checkedFiles.length,
        brokenLinks: brokenLinks.length,
        links: brokenLinks,
      },
      null,
      2,
    ),
  );

  console.log('\n📄 Report saved to broken-links-report.json');
}

main();
