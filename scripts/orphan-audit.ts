import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Get all page routes from app directory
function getRoutes(dir: string, base = ''): string[] {
  const routes: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        // Skip special dirs
        if (['node_modules','.next','(app)','(dashboard)'].includes(entry)) {
          const sub = getRoutes(full, base + '/' + entry.replace(/[()]/g, ''));
          routes.push(...sub);
        } else if (entry.startsWith('(') && entry.endsWith(')')) {
          // Route group — transparent
          const sub = getRoutes(full, base);
          routes.push(...sub);
        } else {
          const sub = getRoutes(full, base + '/' + entry);
          routes.push(...sub);
        }
      } else if (entry === 'page.tsx' || entry === 'page.ts') {
        routes.push(base || '/');
      }
    }
  } catch {}
  return routes;
}

const appDir = '/workspaces/Elevate-lms/app';
const allRoutes = getRoutes(appDir);

// Get all hrefs referenced anywhere in the codebase
const hrefOutput = execSync(
  `grep -roh 'href="[^"]*"\\|href={[^}]*}\\|href=\`[^\`]*\`\\|redirect("[^"]*")\\|redirect(\`[^\`]*\`)\\|push("[^"]*")' /workspaces/Elevate-lms/app /workspaces/Elevate-lms/components /workspaces/Elevate-lms/lib --include="*.tsx" --include="*.ts" 2>/dev/null`,
  { maxBuffer: 10 * 1024 * 1024 }
).toString();

const linkedPaths = new Set<string>();
for (const match of hrefOutput.matchAll(/["'\`](\/([\w\-\/\[\]]+))['"` ]/g)) {
  const path = match[1].split('?')[0].split('#')[0];
  if (path.startsWith('/') && !path.startsWith('//')) {
    linkedPaths.add(path);
  }
}

// Normalize route for comparison (remove dynamic segments)
function normalize(route: string): string {
  return route.replace(/\/\[[^\]]+\]/g, '/[*]');
}

// Find orphaned routes — exist as pages but never linked to
const orphaned: string[] = [];
const linked: string[] = [];

for (const route of allRoutes) {
  const norm = normalize(route);
  // Check if any linked path matches this route
  let isLinked = false;
  for (const lp of linkedPaths) {
    if (normalize(lp) === norm || lp === route) {
      isLinked = true;
      break;
    }
  }
  if (isLinked) linked.push(route);
  else orphaned.push(route);
}

console.log(`\nTOTAL PAGES: ${allRoutes.length}`);
console.log(`LINKED: ${linked.length}`);
console.log(`ORPHANED (never linked to): ${orphaned.length}`);
console.log('\n=== ORPHANED PAGES ===');
orphaned.sort().forEach(r => console.log('  ' + r));
