import fs from 'node:fs';
import path from 'node:path';

/**
 * Surgical Route Splitter v3 - Cross-Device Compatible
 * 
 * Uses 'fs.rmSync' with {recursive: true, force: true} which is compatible 
 * with Docker volume boundaries.
 */

const scope = process.env.BUILD_SCOPE; 
const root = process.cwd();
const appDir = path.join(root, 'app');

if (!scope || scope === 'ASSETS') {
  process.exit(0);
}

const excludeConfig = {
  MARKETING: ['admin', 'apprentice', 'instructor', 'mission-control', 'partner', 'student-portal', 'case-manager', 'intelligence'],
  ADMIN: ['(marketing)', '(public)', 'apprentice', 'instructor', 'student-portal', 'programs', 'healthcare', 'skilled-trades'],
  LMS: ['admin', 'mission-control', 'intelligence', 'partner', 'case-manager', '(marketing)', 'blog']
};

const toRemove = excludeConfig[scope];

if (!toRemove) {
  console.error(`Invalid scope: ${scope}`);
  process.exit(1);
}

console.log(`=== Surgical Split v3: Scope ${scope} ===`);

toRemove.forEach(target => {
  const fullPath = path.join(appDir, target);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing non-target route: ${target}`);
    try {
      // Use rmSync to avoid the EXDEV error. We are in a temporary builder stage, 
      // so deleting these files is safe and permanent for this build instance.
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (e) {
      console.log(`Failed to remove ${target}: ${e.message}`);
    }
  }
});

console.log('✅ Split complete.');
