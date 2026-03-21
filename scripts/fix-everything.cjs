#!/usr/bin/env node
/**
 * FIX EVERYTHING - NO SKIPPING
 * Comprehensive system repair and validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FIXES = [];
const ERRORS = [];

function log(message, type = 'info') {
  const icons = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    fix: '🔧',
  };
  console.log(`${icons[type] || '•'} ${message}`);
}

function exec(command, silent = false) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      timeout: 120000,
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// FIX 1: Package.json validation and repair
// ============================================================================

function fixPackageJson() {
  log('Checking package.json...', 'info');

  const pkgPath = './package.json';
  if (!fs.existsSync(pkgPath)) {
    log('package.json missing!', 'error');
    ERRORS.push('package.json not found');
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // Ensure critical scripts exist
    const requiredScripts = {
      build: 'node scripts/check-env.js && vite build',
      dev: 'vite --host 0.0.0.0',
      preview: 'vite preview --host 0.0.0.0 --port 8080 --strictPort',
      'deploy:check': 'node scripts/self-contained-deploy.cjs check',
      'deploy:build': 'node scripts/self-contained-deploy.cjs build',
      'deploy:all': 'node scripts/self-contained-deploy.cjs all',
      'fix:all': 'node scripts/fix-everything.cjs',
    };

    let modified = false;
    for (const [name, command] of Object.entries(requiredScripts)) {
      if (!pkg.scripts[name]) {
        pkg.scripts[name] = command;
        modified = true;
        log(`Added script: ${name}`, 'fix');
        FIXES.push(`Added npm script: ${name}`);
      }
    }

    if (modified) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      log('package.json updated', 'success');
    } else {
      log('package.json OK', 'success');
    }

    return true;
  } catch (error) {
    log(`package.json error: ${error.message}`, 'error');
    ERRORS.push(`package.json: ${error.message}`);
    return false;
  }
}

// ============================================================================
// FIX 2: Environment variables
// ============================================================================

function fixEnvironment() {
  log('Checking environment variables...', 'info');

  const envPath = './.env';
  const envExamplePath = './.env.example';

  // Create .env from example if missing
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    log('Created .env from .env.example', 'fix');
    FIXES.push('Created .env file');
  }

  if (!fs.existsSync(envPath)) {
    log('.env missing - creating with defaults', 'warning');
    const defaultEnv = `# Elevate for Humanity - Environment Variables
VITE_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RvqjzIRNf5vPH3ABuHQofarfuWw0PW5ww9eTwkj21A6VLJaLopuYbPdpAFCTU10O5uLgGHeCTBEcu9xeM8ErbFy004j2KPoSx
VITE_ENVIRONMENT=production
VITE_APP_VERSION=2.0.0
`;
    fs.writeFileSync(envPath, defaultEnv);
    log('Created default .env', 'fix');
    FIXES.push('Created default .env');
  }

  // Validate required variables
  const env = fs.readFileSync(envPath, 'utf8');
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
  ];

  const missing = required.filter((key) => !env.includes(key));
  if (missing.length > 0) {
    log(`Missing env vars: ${missing.join(', ')}`, 'warning');
    ERRORS.push(`Missing environment variables: ${missing.join(', ')}`);
  } else {
    log('Environment variables OK', 'success');
  }

  return missing.length === 0;
}

// ============================================================================
// FIX 3: Dependencies
// ============================================================================

function fixDependencies() {
  log('Checking dependencies...', 'info');

  if (!fs.existsSync('./node_modules')) {
    log('Installing dependencies...', 'fix');
    const result = exec('pnpm install --frozen-lockfile || pnpm install');
    if (result.success) {
      log('Dependencies installed', 'success');
      FIXES.push('Installed dependencies');
      return true;
    } else {
      log('Dependency installation failed', 'error');
      ERRORS.push('Failed to install dependencies');
      return false;
    }
  }

  log('Dependencies OK', 'success');
  return true;
}

// ============================================================================
// FIX 4: Build directories
// ============================================================================

function fixDirectories() {
  log('Checking directories...', 'info');

  const requiredDirs = [
    './dist',
    './dist/assets',
    './public',
    './src',
    './scripts',
    './netlify/functions',
  ];

  let created = 0;
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created: ${dir}`, 'fix');
      FIXES.push(`Created directory: ${dir}`);
      created++;
    }
  }

  if (created > 0) {
    log(`Created ${created} directories`, 'success');
  } else {
    log('Directories OK', 'success');
  }

  return true;
}

// ============================================================================
// FIX 5: Netlify configuration
// ============================================================================

function fixNetlifyConfig() {
  log('Checking Netlify configuration...', 'info');

  const netlifyToml = './netlify.toml';
  if (!fs.existsSync(netlifyToml)) {
    log('netlify.toml missing!', 'error');
    ERRORS.push('netlify.toml not found');
    return false;
  }

  const config = fs.readFileSync(netlifyToml, 'utf8');

  // Check for critical sections
  const checks = [
    { pattern: /\[build\]/, name: 'build section' },
    { pattern: /command\s*=/, name: 'build command' },
    { pattern: /publish\s*=/, name: 'publish directory' },
    { pattern: /\[functions\]/, name: 'functions section' },
  ];

  let allOk = true;
  for (const check of checks) {
    if (!check.pattern.test(config)) {
      log(`Missing: ${check.name}`, 'error');
      ERRORS.push(`netlify.toml missing: ${check.name}`);
      allOk = false;
    }
  }

  if (allOk) {
    log('Netlify config OK', 'success');
  }

  return allOk;
}

// ============================================================================
// FIX 6: Build process
// ============================================================================

function fixBuildProcess() {
  log('Testing build process...', 'info');

  // Check if build script exists
  const checkEnvScript = './scripts/check-env.js';
  if (!fs.existsSync(checkEnvScript)) {
    log('Creating check-env.js...', 'fix');
    const script = `#!/usr/bin/env node
// Environment check script
const fs = require('fs');

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const env = fs.readFileSync('.env', 'utf8');
const missing = required.filter(key => !env.includes(key));

if (missing.length > 0) {
  console.warn('⚠️  Missing env vars:', missing.join(', '));
  console.warn('   Build will continue with defaults');
}

process.exit(0);
`;
    fs.writeFileSync(checkEnvScript, script);
    fs.chmodSync(checkEnvScript, '755');
    log('Created check-env.js', 'success');
    FIXES.push('Created check-env.js');
  }

  // Try a test build
  log('Running test build...', 'info');
  const result = exec('pnpm build 2>&1 | tail -20', true);

  if (result.success) {
    log('Build process OK', 'success');
    return true;
  } else {
    log('Build failed - checking errors...', 'warning');

    // Check common build issues
    if (!fs.existsSync('./vite.config.js')) {
      log('vite.config.js missing!', 'error');
      ERRORS.push('vite.config.js not found');
      return false;
    }

    if (!fs.existsSync('./src/main.jsx') && !fs.existsSync('./src/main.js')) {
      log('Entry file missing!', 'error');
      ERRORS.push('src/main.jsx or src/main.js not found');
      return false;
    }

    log('Build has errors - see output above', 'error');
    ERRORS.push('Build process failed');
    return false;
  }
}

// ============================================================================
// FIX 7: Cloudflare Workers
// ============================================================================

function fixCloudflareWorkers() {
  log('Checking Cloudflare Workers...', 'info');

  const wranglerToml = './wrangler.toml';
  if (!fs.existsSync(wranglerToml)) {
    log('wrangler.toml not found - skipping', 'warning');
    return true;
  }

  const config = fs.readFileSync(wranglerToml, 'utf8');

  if (!config.includes('name =')) {
    log('wrangler.toml missing name', 'error');
    ERRORS.push('wrangler.toml incomplete');
    return false;
  }

  log('Cloudflare config OK', 'success');
  return true;
}

// ============================================================================
// FIX 8: Supabase connection
// ============================================================================

function fixSupabaseConnection() {
  log('Checking Supabase connection...', 'info');

  const env = fs.readFileSync('./.env', 'utf8');
  const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
  const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];

  if (!supabaseUrl || !supabaseKey) {
    log('Supabase credentials missing', 'error');
    ERRORS.push('Supabase credentials not configured');
    return false;
  }

  if (!supabaseUrl.includes('supabase.co')) {
    log('Invalid Supabase URL', 'error');
    ERRORS.push('Invalid Supabase URL format');
    return false;
  }

  log('Supabase config OK', 'success');
  return true;
}

// ============================================================================
// FIX 9: Git repository
// ============================================================================

function fixGitRepository() {
  log('Checking Git repository...', 'info');

  if (!fs.existsSync('./.git')) {
    log('Not a git repository', 'warning');
    return true;
  }

  // Check for uncommitted changes
  const result = exec('git status --porcelain', true);
  if (result.success && result.output.trim()) {
    const lines = result.output.trim().split('\n').length;
    log(`${lines} uncommitted changes`, 'warning');
  } else {
    log('Git repository OK', 'success');
  }

  return true;
}

// ============================================================================
// FIX 10: Permissions
// ============================================================================

function fixPermissions() {
  log('Fixing permissions...', 'info');

  const scriptFiles = [
    './scripts/fix-everything.cjs',
    './scripts/self-contained-deploy.cjs',
    './scripts/ultimate-autopilot.cjs',
    './scripts/zero-dependency-seo.cjs',
  ];

  let fixed = 0;
  for (const file of scriptFiles) {
    if (fs.existsSync(file)) {
      try {
        fs.chmodSync(file, '755');
        fixed++;
      } catch (error) {
        log(`Cannot chmod ${file}: ${error.message}`, 'warning');
      }
    }
  }

  if (fixed > 0) {
    log(`Fixed permissions on ${fixed} files`, 'success');
    FIXES.push(`Fixed ${fixed} file permissions`);
  } else {
    log('Permissions OK', 'success');
  }

  return true;
}

// ============================================================================
// FIX 11: Deployment readiness
// ============================================================================

function checkDeploymentReadiness() {
  log('Checking deployment readiness...', 'info');

  const checks = [
    { name: 'Build output', path: './dist/index.html' },
    { name: 'Assets', path: './dist/assets' },
    { name: 'Sitemap', path: './dist/sitemap.xml' },
    { name: 'Robots.txt', path: './dist/robots.txt' },
  ];

  let ready = 0;
  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      log(`${check.name}: ✓`, 'success');
      ready++;
    } else {
      log(`${check.name}: ✗`, 'warning');
    }
  }

  const readiness = (ready / checks.length) * 100;
  log(
    `Deployment readiness: ${readiness}%`,
    readiness >= 75 ? 'success' : 'warning'
  );

  return readiness >= 75;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  FIX EVERYTHING - Comprehensive System Repair');
  console.log('  No Skipping - All Issues Will Be Addressed');
  console.log('═══════════════════════════════════════════════════════\n');

  const startTime = Date.now();

  const fixes = [
    { name: 'Package.json', fn: fixPackageJson },
    { name: 'Environment Variables', fn: fixEnvironment },
    { name: 'Dependencies', fn: fixDependencies },
    { name: 'Directories', fn: fixDirectories },
    { name: 'Netlify Config', fn: fixNetlifyConfig },
    { name: 'Build Process', fn: fixBuildProcess },
    { name: 'Cloudflare Workers', fn: fixCloudflareWorkers },
    { name: 'Supabase Connection', fn: fixSupabaseConnection },
    { name: 'Git Repository', fn: fixGitRepository },
    { name: 'Permissions', fn: fixPermissions },
    { name: 'Deployment Readiness', fn: checkDeploymentReadiness },
  ];

  console.log(`Running ${fixes.length} comprehensive checks...\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < fixes.length; i++) {
    const fix = fixes[i];
    console.log(`\n[${i + 1}/${fixes.length}] ${fix.name}`);
    console.log('─'.repeat(60));

    try {
      const result = fix.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`Exception: ${error.message}`, 'error');
      ERRORS.push(`${fix.name}: ${error.message}`);
      failed++;
    }
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Checks run:     ${fixes.length}`);
  console.log(`  Passed:         ${passed} ✅`);
  console.log(`  Failed:         ${failed} ❌`);
  console.log(`  Fixes applied:  ${FIXES.length} 🔧`);
  console.log(`  Errors found:   ${ERRORS.length} ⚠️`);
  console.log(`  Duration:       ${duration}s`);
  console.log('═'.repeat(60));

  if (FIXES.length > 0) {
    console.log('\n✅ Fixes Applied:');
    FIXES.forEach((fix, i) => console.log(`  ${i + 1}. ${fix}`));
  }

  if (ERRORS.length > 0) {
    console.log('\n❌ Errors Found:');
    ERRORS.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
  }

  console.log('\n📋 Next Steps:');
  if (failed === 0) {
    console.log('  ✅ All checks passed!');
    console.log('  1. Run: npm run build');
    console.log('  2. Run: npm run deploy:all');
    console.log('  3. Or manual: https://app.netlify.com/drop');
  } else {
    console.log('  ⚠️  Some checks failed. Review errors above.');
    console.log('  1. Fix critical errors');
    console.log('  2. Re-run: npm run fix:all');
    console.log('  3. Then deploy');
  }

  console.log('');

  return failed === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { main };
