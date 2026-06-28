import fs from 'node:fs';
import path from 'node:path';

/**
 * Route Splitter — Quarantines non-target routes to reduce build memory.
 * 
 * Target Scopes:
 *   1. MARKETING: Only public landing pages + store.
 *   2. ADMIN: Only administrative and staff portals.
 *   3. LMS: Only student, apprentice, and instructor portals.
 */

const scope = process.env.BUILD_SCOPE; // 'MARKETING' | 'ADMIN' | 'LMS' | 'ASSETS'
const root = process.cwd();
const appDir = path.join(root, 'app');

if (!scope || scope === 'ASSETS') {
  console.log('No scope or ASSETS scope. skipping split.');
  process.exit(0);
}

const scopes = {
  MARKETING: {
    keep: ['(marketing)', '(public)', 'about', 'blog', 'programs', 'store', 'contact', 'apply', 'api', 'favicon.ico', 'globals.css', 'layout.tsx'],
    remove: ['admin', 'apprentice', 'instructor', 'mission-control', 'partner', 'student-portal']
  },
  ADMIN: {
    keep: ['admin', 'mission-control', 'intelligence', 'dev-studio', 'api', 'layout.tsx', 'globals.css'],
    remove: ['(marketing)', '(public)', 'apprentice', 'instructor', 'programs', 'store', 'blog']
  },
  LMS: {
    keep: ['apprentice', 'lms', 'instructor', 'course-preview', 'student-portal', 'api', 'layout.tsx', 'globals.css'],
    remove: ['admin', 'mission-control', '(marketing)', '(public)', 'programs', 'store', 'blog']
  }
};

const config = scopes[scope];

if (!config) {
  console.error(`Invalid scope: ${scope}`);
  process.exit(1);
}

console.log(`=== App Splitter: Scope ${scope} ===`);

config.remove.forEach(dir => {
  const fullPath = path.join(appDir, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Quarantining: ${dir}`);
    // Hide by prefixing with __ (Next.js ignores these)
    fs.renameSync(fullPath, path.join(appDir, `__${dir}`));
  }
});

console.log('✅ Split complete. Build will now only process target routes.');
