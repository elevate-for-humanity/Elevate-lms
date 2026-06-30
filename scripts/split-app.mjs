import fs from 'node:fs';
import path from 'node:path';

/**
 * Surgical Build Excluder v4 - Non-Destructive Relocation
 * 
 * Instead of deleting files, this script temporarily moves excluded 
 * directories to '.exclude/' during the build phase. This ensures 
 * the repository remains the single source of truth.
 */

const scope = process.env.BUILD_SCOPE; 
const root = process.cwd();
const appDir = path.join(root, 'app');
const excludeDir = path.join(root, '.exclude');

// Ensure exclude directory exists
if (!fs.existsSync(excludeDir)) {
  fs.mkdirSync(excludeDir);
}

if (!scope || scope === 'ASSETS') {
  console.log('No BUILD_SCOPE set or scope is ASSETS. Skipping exclusion.');
  process.exit(0);
}

const config = {
  MARKETING: {
    include: ['about', 'programs', 'funding', 'blog', 'store', 'contact', 'careers', 'resources', 'forms', 'pricing', 'faq', 'how-it-works', 'impact', 'success-stories', 'testing', 'legal'],
    base: ['page.tsx', 'layout.tsx', 'globals.css', 'not-found.tsx', 'loading.tsx', 'error.tsx']
  },
  ADMIN: {
    include: ['admin', 'admin-login', 'analytics', 'reports', 'audit-logs', 'case-manager', 'governance', 'security', 'credentials', 'platform'],
    base: ['layout.tsx', 'globals.css', 'not-found.tsx', 'loading.tsx', 'error.tsx']
  },
  LMS: {
    include: ['lms', 'partner', 'learner', 'instructor', 'apprenticeships', 'barber-and-beauty-apprenticeships', 'calendar', 'messages', 'certificates', 'testing', 'legal', 'resources', 'store', 'blog'],
    base: ['layout.tsx', 'globals.css', 'not-found.tsx', 'loading.tsx', 'error.tsx']
  }
};

const sharedWhitelist = ['api', 'auth', '(auth)', '(public)', 'health', 'data', 'lib'];

const currentScope = config[scope];
if (!currentScope) {
  console.error(`Invalid scope: ${scope}`);
  process.exit(1);
}

console.log(`=== Build Exclusion v4: Scope ${scope} ===`);

const allFolders = fs.readdirSync(appDir);

allFolders.forEach(folder => {
  const fullPath = path.join(appDir, folder);
  if (!fs.lstatSync(fullPath).isDirectory()) {
    // If it's a base file we need, keep it.
    if (currentScope.base.includes(folder) || sharedWhitelist.includes(folder)) return;
  }

  // If it's a directory we need, keep it.
  if (currentScope.include.includes(folder) || sharedWhitelist.includes(folder)) {
    console.log(`[Include] ${folder}`);
    return;
  }

  // Otherwise, move to .exclude
  const targetPath = path.join(excludeDir, folder);
  try {
    // If target already exists in .exclude (from a previous failed run), remove it first
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    fs.renameSync(fullPath, targetPath);
    console.log(`[Exclude] ${folder} (moved to .exclude/)`);
  } catch (err) {
    console.error(`Failed to exclude ${folder}: ${err.message}`);
  }
});

console.log('✅ Build context localized. (Excluded files are in .exclude/)');
