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

const whitelist = ['api', 'auth', '(auth)', 'layout.tsx', 'page.tsx', 'globals.css', 'not-found.tsx', 'loading.tsx', 'error.tsx', 'health', 'data', 'funding', 'barber-and-beauty-apprenticeships', 'partner'];

const toRemove = excludeConfig[scope];

if (!toRemove) {
  console.error(`Invalid scope: ${scope}`);
  process.exit(1);
}

console.log(`=== Surgical Split v3: Scope ${scope} ===`);
console.log(`Working directory: ${appDir}`);

// 1. Remove explicitly excluded directories
toRemove.forEach(target => {
  if (whitelist.includes(target)) {
    console.log(`Skipping whitelisted target: ${target}`);
    return;
  }
  const fullPath = path.resolve(appDir, target);
  
  if (fs.existsSync(fullPath)) {
    try {
      console.log(`Removing excluded target: ${target} -> ${fullPath}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to remove ${target}: ${err.message}`);
    }
  }
});

// 2. Comprehensive Cleanup: Remove any other folders not in scope (Aggressive mode)
// This ensures that for LMS, we don't have thousands of legacy folders bloating the build.
const currentFolders = fs.readdirSync(appDir);
currentFolders.forEach(folder => {
  const fullPath = path.join(appDir, folder);
  if (!fs.lstatSync(fullPath).isDirectory()) return;

  // Preserve whitelist and the scope-specific folders we WANT
  const preserve = [...whitelist, 'lms', 'admin', '(marketing)', '(public)'];
  
  if (scope === 'MARKETING' && folder === 'lms') return;
  if (scope === 'ADMIN' && folder === 'admin') return;
  if (scope === 'LMS' && folder === 'lms') return;

  if (!preserve.includes(folder) && !toRemove.includes(folder)) {
    try {
      console.log(`Aggressive Clean: Removing ${folder}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors for system files
    }
  }
});

console.log('✅ Split complete.');
