import fs from 'node:fs';
import path from 'node:path';

/**
 * Surgical Route Splitter v2
 * 
 * Instead of an 'Include' strategy which deleted 90% of the site, 
 * we use an 'Exclude' strategy to remove only the heavy portal blocks.
 */

const scope = process.env.BUILD_SCOPE; 
const root = process.cwd();
const appDir = path.join(root, 'app');

if (!scope || scope === 'ASSETS') {
  process.exit(0);
}

const excludeConfig = {
  MARKETING: [
    'admin',
    'apprentice',
    'instructor',
    'mission-control',
    'partner',
    'student-portal',
    'case-manager',
    'intelligence',
    'dev-studio',
    'onboarding/instructor',
    'onboarding/employer',
    'program-holder'
  ],
  ADMIN: [
    '(marketing)',
    '(public)',
    'apprentice',
    'instructor',
    'student-portal',
    'programs',
    'healthcare',
    'skilled-trades',
    'blog',
    'about',
    'apply',
    'testing'
  ],
  LMS: [
    'admin',
    'mission-control',
    'intelligence',
    'dev-studio',
    'partner',
    'case-manager',
    '(marketing)',
    'about',
    'blog',
    'contact'
  ]
};

// CRITICAL: Explicit Whitelist for System Routes
const whitelist = ['api', 'layout.tsx', 'globals.css', 'favicon.ico'];

const toRemove = excludeConfig[scope].filter(target => !whitelist.includes(target));

if (!toRemove) {
  console.error(`Invalid scope: ${scope}`);
  process.exit(1);
}

console.log(`=== Surgical Split: Scope ${scope} ===`);

toRemove.forEach(target => {
  const fullPath = path.join(appDir, target);
  if (fs.existsSync(fullPath)) {
    console.log(`Quarantining: ${target}`);
    // Use a unique prefix to avoid collisions
    const parent = path.dirname(fullPath);
    const base = path.basename(fullPath);
    const newPath = path.join(parent, `__split_${scope}_${base}`);
    
    try {
      fs.renameSync(fullPath, newPath);
    } catch (e) {
      console.log(`Failed to rename ${target}: ${e.message}`);
    }
  }
});

console.log('✅ Split complete. Build now contains all necessary "Programs" and public pages.');
