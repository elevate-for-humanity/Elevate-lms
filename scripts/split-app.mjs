import fs from 'node:fs';
import path from 'node:path';

/**
 * Dependency-Aware Route Splitter v4
 *
 * Fixes: Module not found errors by ensuring deleted routes don't break imports.
 *
 * Key principles:
 * 1. NEVER delete shared code (components/, lib/, hooks/, etc.)
 * 2. Only prune route entry points, never their dependencies
 * 3. Validate imports before completing
 */

const scope = process.env.BUILD_SCOPE;
const root = process.cwd();
const appDir = path.join(root, 'app');

if (!scope || scope === 'ASSETS') {
  process.exit(0);
}

// Shared code that should NEVER be deleted
const ALWAYS_KEEP_DIRS = new Set([
  'components',
  'lib',
  'hooks',
  'utils',
  'providers',
  'contexts',
  'types',
  'styles',
  'content'
]);

// SAFETY: Always use DRY_RUN in CI to prevent accidental deletions
// Only run LIVE mode when explicitly enabled via SPLIT_LIVE_MODE=true
const DRY_RUN = process.env.SPLIT_LIVE_MODE !== 'true';
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no deletions)' : 'LIVE (will delete files)'}`);

// Route prefixes to exclude for each scope
const ROUTE_EXCLUSIONS = {
  MARKETING: [
    'admin',
    'mission-control',
    'intelligence',
    'case-manager',
    'lms'
  ],
  ADMIN: [
    '(marketing)',
    '(public)',
    'programs',
    'lms',
    'store',
    'apply'
  ],
  LMS: [
    'admin',
    'mission-control',
    'intelligence',
    'partner',
    'case-manager',
    '(marketing)',
    'blog',
    'store',
    'apply',
    'about'
  ]
};

// Routes that should be kept regardless of scope (shared/public)
const SHARED_ROUTES = new Set([
  'api',
  'auth',
  '(auth)',
  'legal',
  'health',
  'data',
  'funding',
  'testing',
  'certificates',
  'videos',
  'login',
  'signup',
  'forgot-password',
  'verify-credentials',
  'barber-and-beauty-apprenticeships',
  'programs',
  'lms',
  'store',
  'apply',
  'contact'
]);

// Scope-specific routes that should be kept
const SCOPE_ROUTES = {
  MARKETING: new Set([
    '(marketing)',
    '(public)',
    'about',
    'apply',
    'admin',
    'student',
    'portals',
    'store',
    'programs',
    'contact',
    'login',
    'signup',
    'legal',
    'health',
    'testing',
    'certificates',
    'videos',
    // Public Marketing
    'blog',
    'press',
    'site-map',
    'faq',
    'funding',
    'accessibility',
    // Lead Gen Pages
    'career-training',
    'success-stories',
    'cna-waitlist',
    'hire-graduates',
    'start',
    'check-eligibility',
    'partnerships',
    'how-it-works',
    'pathways',
    // Core Pages
    'booking',
    'jobs',
    'search',
    'calendar',
    'schedule',
    'pay',
    // Special Programs
    'workforce-board',
    'find-workone',
    'barber-and-beauty-apprenticeships',
    'education',
    // Store/Products
    'for-students',
    'for-employers',
    'for-providers',
    // Credentials/Certs
    'accreditation',
    'certiport-exam',
    'credentials',
    // AI/Chat
    'ai-chat',
    'achievements',
    // Special Services
    'community-services',
    'help',
    'careers',
    // Additional Marketing Pages
    'donate',
    'jri',
    'resources',
    'services',
    'verify',
    // All portal pages
    'partner',
    'case-manager',
    'mission-control',
    'intelligence',
    'employer',
    'apprentice',
    'program-holder',
    'host-shop',
    'barber-host-shop',
    'license',
    'ebook',
    'dashboards',
    'wioa-eligibility',
    'career-services',
    'support',
    'apprenticeship-sponsor',
    'equal-opportunity',
    'cookies',
    'dmca',
    'forgot-password',
    'reset-password',
    'testimonials',
    'messages',
    'notifications',
    'security',
    'settings',
    'profile',
    'reports',
    'import',
    'advising',
    'docs',
    'compliance',
    'lms'
  ]),
  ADMIN: new Set([
    'admin',
    'api',
    'auth',
    '(auth)',
    'legal',
    'health',
    'data',
    'funding',
    'testing',
    'certificates',
    'videos',
    'login',
    'signup',
    'forgot-password'
  ]),
  LMS: new Set([
    'lms',
    'api',
    'auth',
    '(auth)',
    'legal',
    'health',
    'data',
    'funding',
    'testing',
    'certificates',
    'videos',
    'login',
    'signup',
    'forgot-password',
    'barber-and-beauty-apprenticeships',
    'programs'
  ])
};

const toRemove = ROUTE_EXCLUSIONS[scope];

if (!toRemove) {
  console.error(`Invalid scope: ${scope}`);
  process.exit(1);
}

console.log(`=== Dependency-Aware Split v4: Scope ${scope} ===`);
console.log(`Working directory: ${appDir}`);

// Build dependency graph - find all imports in retained code
function getAllSourceFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          walk(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

function extractImports(fileContent) {
  const imports = [];
  const importRegex = /import\s+(?:[\w*{}\s,]+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(fileContent)) !== null) {
    imports.push(match[1]);
  }
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(fileContent)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveAlias(importPath, baseDir) {
  if (!importPath.startsWith('@/')) return null;
  const relative = importPath.slice(2);
  const resolved = path.join(root, relative);
  const exts = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
  for (const ext of exts) {
    if (fs.existsSync(resolved + ext)) {
      return resolved + ext;
    }
  }
  return fs.existsSync(resolved) ? resolved : null;
}

console.log('Building dependency graph...');
const sourceFiles = getAllSourceFiles(root, ['.ts', '.tsx', '.js', '.jsx']);
const projectFiles = sourceFiles.filter(f => !f.includes('node_modules'));

const referencedPaths = new Set();
for (const file of projectFiles) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    for (const imp of imports) {
      if (imp.startsWith('@/')) {
        const resolved = resolveAlias(imp, path.dirname(file));
        if (resolved) {
          referencedPaths.add(resolved);
          let dir = path.dirname(resolved);
          while (dir !== root && dir !== path.join(root, 'app') && dir !== path.join(root, 'components') && dir !== path.join(root, 'lib')) {
            referencedPaths.add(dir);
            dir = path.dirname(dir);
          }
        }
      }
    }
  } catch {
    // Skip unreadable files
  }
}
console.log(`Found ${referencedPaths.size} referenced paths`);

// Remove only route entry points that are excluded
// BUT respect SCOPE_ROUTES - never delete directories that are in scope
console.log('\nRemoving excluded routes...');
for (const target of toRemove) {
  const fullPath = path.join(appDir, target);
  if (fs.existsSync(fullPath)) {
    // NEVER delete if it's a scope-specific route
    if (SCOPE_ROUTES[scope]?.has(target)) {
      console.log(`✓ PRESERVE ${target} (${scope} scope route)`);
      continue;
    }
    
    let isReferenced = referencedPaths.has(fullPath);
    if (!isReferenced) {
      const filesInDir = getAllSourceFiles(fullPath);
      for (const file of filesInDir) {
        if (referencedPaths.has(file)) {
          isReferenced = true;
          break;
        }
      }
    }
    if (isReferenced) {
      console.log(`⚠️  PRESERVE ${target} (still referenced by imports)`);
    } else {
      console.log(`Would remove: ${target}`);
      if (!DRY_RUN) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (err) {
          console.error(`Failed to remove ${target}: ${err.message}`);
        }
      }
    }
  }
}

// Aggressive cleanup ONLY for routes, NOT shared code
console.log('\nAggressive cleanup (routes only)...');
const currentFolders = fs.readdirSync(appDir);
for (const folder of currentFolders) {
  const fullPath = path.join(appDir, folder);
  if (!fs.lstatSync(fullPath).isDirectory()) continue;

  // NEVER delete shared code directories
  if (ALWAYS_KEEP_DIRS.has(folder)) {
    console.log(`🛡️  PRESERVE ${folder} (shared code)`);
    continue;
  }

  if (SHARED_ROUTES.has(folder)) {
    console.log(`✓ KEEP ${folder} (shared route)`);
    continue;
  }

  // Check scope-specific routes
  if (SCOPE_ROUTES[scope]?.has(folder)) {
    console.log(`✓ KEEP ${folder} (${scope} route)`);
    continue;
  }

  let isReferenced = referencedPaths.has(fullPath);
  if (!isReferenced) {
    const filesInDir = getAllSourceFiles(fullPath);
    for (const file of filesInDir) {
      if (referencedPaths.has(file)) {
        isReferenced = true;
        break;
      }
    }
  }

  if (isReferenced) {
    console.log(`✓ KEEP ${folder} (referenced by imports)`);
  } else {
    console.log(`Would remove: ${folder}`);
    if (!DRY_RUN) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

// Validate - check for broken imports
console.log('\nValidating imports...');
const missingImports = [];
const remainingFiles = getAllSourceFiles(appDir, ['.ts', '.tsx']);

for (const file of remainingFiles) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const imports = extractImports(content);
    for (const imp of imports) {
      if (imp.startsWith('@/')) {
        const resolved = resolveAlias(imp, path.dirname(file));
        if (!resolved || !fs.existsSync(resolved)) {
          missingImports.push({ file, import: imp });
        }
      }
    }
  } catch {
    // Skip unreadable files
  }
}

if (missingImports.length > 0) {
  console.error('\n❌ BROKEN IMPORTS DETECTED:');
  missingImports.slice(0, 20).forEach(({ file, import: imp }) => {
    console.error(`  ${path.relative(root, file)}: ${imp}`);
  });
  if (missingImports.length > 20) {
    console.error(`  ... and ${missingImports.length - 20} more`);
  }
  console.error('\nAborting build due to broken imports.');
  process.exit(1);
}

console.log('✅ Split complete - all imports validated.');
