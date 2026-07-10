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

/**
 * ROUTE EXCLUSIONS BY BUILD
 * 
 * Each build EXCLUDES routes owned by other builds to prevent:
 * - 404 errors (page excluded but URL still exists)
 * - Code bloat (unused routes in wrong builds)
 * - Route conflicts
 * 
 * MARKETING = Public website, marketing pages, store, apply, ALL portals
 * ADMIN = Admin dashboard and management pages (/admin/*)
 * LMS = Student learning, apprentice, profile pages (/lms/*, /learner/*)
 */

// Routes OWNED by MARKETING (kept in Marketing build)
const MARKETING_OWNED = new Set([
  // Core
  'about', 'contact', 'team', 'careers', 'press', 'news', 'site-map',
  // Programs
  'programs', 'barber-and-beauty-apprenticeships',
  'barber-host-shop', 'cosmetology-host-shop', 'esthetician-host-shop', 'nail-host-shop',
  // Apply
  'apply', 'eligibility', 'check-eligibility', 'next-steps', 'onboarding', 'orientation', 'enrollment',
  // Store
  'store', 'shop', 'licensing', 'licenses', 'checkout', 'compare', 'demo', 'demos', 'white-label',
  // Funding
  'funding', 'financing', 'wioa-eligibility', 'wioa-participant', 'donate', 'scholarships', 'tuition', 'pricing',
  // Testing
  'testing', 'certiport-exam', 'certificates', 'credentials', 'credential', 'verify',
  // Career
  'career-training', 'career-training-indiana', 'healthcare-training-indianapolis',
  'skilled-trades-training-indiana', 'workforce-board', 'workforce-partners',
  'career-services', 'career-assessment', 'career-counseling',
  'find-workone', 'workone-partner-packet', 'employment-support', 'hire-graduates',
  // For pages
  'for-employers', 'for-partners', 'for-agencies', 'for-providers', 'for-students',
  // Marketing
  'solutions', 'how-it-works', 'pathways', 'success-stories', 'testimonials', 'start', 'booking',
  // Education
  'education', 'training', 'launch', 'schools', 'grants', 'government', 'industries',
  'microclasses', 'syllabi', 'webinars', 'ebooks', 'reels',
  // Resources
  'resources', 'documents', 'docs', 'forms', 'workbooks', 'data',
  // Community
  'community-services', 'community-services-indiana', 'agencies', 'volunteer',
  'impact', 'metrics', 'outcomes',
  // Legal
  'legal', 'compliance', 'ferpa', 'equal-opportunity', 'federal-compliance',
  'grievance', 'transparency', 'disaster-recovery', 'cookies', 'privacy', 'terms', 'dmca', 'accessibility',
  // Services
  'services', 'healthcare', 'locations', 'academic-calendar', 'events', 'updates',
  'jri', 'fssa', 'snap', 'ojt-and-funding',
  // Special
  'cna-waitlist', 'mobile-app', 'mobile', 'connect', 'inquiry', 'directory', 'search',
  'calendar', 'pay', 'booth-rental', 'instructional-framework',
  'satisfactory-academic-progress', 'writing-center', 'educatorhub',
  'founder', 'roi', 'implementation', 'trust', 'suboffice-onboarding', 'alumni', 'platform',
  // Portals (Landing pages in Marketing)
  'host-shop', 'employer', 'employers', 'partner', 'partner-directory',
  'program-holder', 'case-manager', 'apprentice', 'apprenticeship-sponsor',
  'dashboards', 'portals', 'license', 'ai-chat',
  // Blog
  'blog',
  // AI
  'ai', 'ai-tutor',
  // Public
  'login', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'verify-credentials', 'admin-login',
  // Additional public pages (missing from categorization)
  'academic-integrity', 'accreditation', 'application-success', 'apprenticeships', 'apprenticeship-programs',
  'beauty-checkout', 'call-now', 'certification-testing', 'consumer-disclosures', 'consumer-education',
  'contracts', 'copyright', 'downloads', 'ebook', 'email', 'enroll', 'error', 'faq', 'governance',
  'handbook', 'help', 'institutional-governance', 'instructor-credentials', 'jobs',
  'legal-entity-structure', 'license-suspended', 'mou', 'orientation-video', 'parent-portal',
  'paris', 'partner', 'partner-learning', 'partners', 'partnerships', 'philanthropy', 'policies',
  'portal', 'privacy-policy', 'refund-policy', 'security', 'security-and-data-protection',
  'share', 'sitemap', 'staff', 'start-trial', 'status', 'student-resources', 'support',
  'tax', 'tenant-site', 'terms-of-service', 'thankyou', 'tuition-fees', 'unauthorized',
  'update-password', 'verify-identity', 'workforce', 'workkeys'
]);

// Routes OWNED by ADMIN (kept in Admin build)
const ADMIN_OWNED = new Set([
  'admin', 'admin-login',
  // Admin sub-routes
  'analytics', 'approvals', 'apps', 'create-course', 'dashboard', 'dev', 'file-manager',
  'install-app', 'operator', 'partner-operating-model', 'partner-upload', 'preview',
  'provider', 'settings', 'sign', 'builder', 'connects', 'creator', 'instructor'
]);

// Routes OWNED by LMS (kept in LMS build)
const LMS_OWNED = new Set([
  'lms',
  'learner',
  'student',
  'students',
  'profile',
  'account',
  'achievements',
  'messages',
  'notifications',
  'reports',
  'import',
  'advising',
  'attendance',
  'learning',
  'courses',
  'course-preview',
  'schedule',
  'schedule-consultation',
  'student-support',
  'actions',
  'subscription',
  // Additional LMS pages
  'accept-invite', 'access-paused', 'banking', 'billing', 'billing-required', 'card',
  'leaderboard', 'offline', 'orientation-video', 'payment', 'payment-error', 'proctor',
  'transcript', 'tutoring', 'verification-approvals'
]);

// Route prefixes to exclude for each scope
const ROUTE_EXCLUSIONS = {
  MARKETING: [
    // Remove ADMIN routes from Marketing
    ...Array.from(ADMIN_OWNED),
    // Remove LMS routes from Marketing
    ...Array.from(LMS_OWNED)
  ],
  ADMIN: [
    // Remove MARKETING routes from Admin
    ...Array.from(MARKETING_OWNED).filter(r => r !== 'admin-login'),
    // Remove LMS routes from Admin
    ...Array.from(LMS_OWNED)
  ],
  LMS: [
    // Remove ADMIN routes from LMS
    ...Array.from(ADMIN_OWNED),
    // Remove MARKETING routes from LMS
    ...Array.from(MARKETING_OWNED).filter(r => !['verify', 'certificates', 'credentials'].includes(r))
  ]
};

// Routes that should be kept regardless of scope (shared/public)
const SHARED_ROUTES = new Set([
  'api',
  'auth',
  '(auth)',
  'videos',
  'health',
  // Credentials (public verification)
  'certificates',
  'credentials',
  'verify',
  // Legal (required by all)
  'legal',
  'privacy',
  'terms',
  'cookies',
  'accessibility',
  // Public
  'data'
]);

// Scope-specific routes that should be kept
const SCOPE_ROUTES = {
  MARKETING: MARKETING_OWNED,
  ADMIN: ADMIN_OWNED,
  LMS: LMS_OWNED
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
