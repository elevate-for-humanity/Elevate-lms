#!/usr/bin/env node

/**
 * Autopilot Status Checker
 * Verifies all autopilot scripts are configured and working
 */

import { promises as fs } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(70), 'cyan');
}

async function checkFile(filePath) {
  try {
    await fs.access(path.join(ROOT, filePath));
    return true;
  } catch {
    return false;
  }
}

async function checkExecutable(filePath) {
  try {
    const stats = await fs.stat(path.join(ROOT, filePath));
    return (stats.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

async function checkAutopilots() {
  section('🤖 AUTOPILOT STATUS CHECK');

  const autopilots = [
    {
      name: 'Routes Autopilot',
      file: 'scripts/routes-autopilot.mjs',
      description: 'Auto-generates router from pages',
      integration: 'Manual run (can timeout)',
      status: 'configured',
    },
    {
      name: 'Dynamic Sitemap Generator',
      file: 'scripts/generate-dynamic-sitemap.mjs',
      description: 'Generates sitemap with dynamic routes',
      integration: 'postbuild hook',
      status: 'active',
    },
    {
      name: 'Sitemap Splitter',
      file: 'scripts/split-sitemap.mjs',
      description: 'Splits large sitemaps',
      integration: 'postbuild hook',
      status: 'active',
    },
    {
      name: 'Broken Links Fixer',
      file: 'scripts/fix-broken-links.mjs',
      description: 'Fixes broken internal links',
      integration: 'postbuild hook',
      status: 'active',
    },
    {
      name: 'Domain URL Fixer',
      file: 'scripts/fix-domain-urls.js',
      description: 'Normalizes domain URLs',
      integration: 'postbuild hook',
      status: 'active',
    },
    {
      name: 'Canonical URL Updater',
      file: 'scripts/update-canonical-urls.js',
      description: 'Updates canonical URLs',
      integration: 'postbuild hook',
      status: 'active',
    },
    {
      name: 'Source Maps Remover',
      file: 'scripts/no-source-maps.cjs',
      description: 'Removes source maps from production',
      integration: 'postbuild hook',
      status: 'active',
    },
    {
      name: 'Postbuild Script',
      file: 'scripts/postbuild.mjs',
      description: 'Post-build optimizations',
      integration: 'postbuild hook',
      status: 'active',
    },
    {
      name: 'LMS Fixer Autopilot',
      file: 'scripts/autopilot-fix-lms.mjs',
      description: 'Orchestrator-based LMS fixes',
      integration: 'Manual/orchestrator',
      status: 'configured',
    },
    {
      name: 'Build Web Autopilot',
      file: 'scripts/autopilot-build-web.sh',
      description: 'Automated web build process',
      integration: 'Manual',
      status: 'configured',
    },
    {
      name: 'Verify Build Autopilot',
      file: 'scripts/autopilot-verify-build.sh',
      description: 'Build verification',
      integration: 'Manual',
      status: 'configured',
    },
    {
      name: 'Advanced Autopilot',
      file: 'scripts/advanced-autopilot.sh',
      description: 'Continuous testing and deployment',
      integration: 'Manual',
      status: 'configured',
    },
    {
      name: 'Autopilot Loop',
      file: 'scripts/autopilot-loop.sh',
      description: 'Continuous monitoring',
      integration: 'Manual',
      status: 'configured',
    },
    {
      name: 'Main Autopilot',
      file: 'scripts/autopilot.sh',
      description: 'Dev server monitoring',
      integration: 'Manual',
      status: 'configured',
    },
  ];

  const results = {
    active: [],
    configured: [],
    missing: [],
    notExecutable: [],
  };

  for (const autopilot of autopilots) {
    const exists = await checkFile(autopilot.file);
    const executable = exists ? await checkExecutable(autopilot.file) : false;

    if (!exists) {
      results.missing.push(autopilot);
      log(`❌ ${autopilot.name}`, 'red');
      log(`   File: ${autopilot.file}`, 'red');
      log(`   Status: MISSING`, 'red');
    } else if (!executable && autopilot.file.endsWith('.sh')) {
      results.notExecutable.push(autopilot);
      log(`⚠️  ${autopilot.name}`, 'yellow');
      log(`   File: ${autopilot.file}`, 'yellow');
      log(`   Status: NOT EXECUTABLE`, 'yellow');
    } else {
      if (autopilot.status === 'active') {
        results.active.push(autopilot);
        log(`✅ ${autopilot.name}`, 'green');
      } else {
        results.configured.push(autopilot);
        log(`🔧 ${autopilot.name}`, 'blue');
      }
      log(`   File: ${autopilot.file}`);
      log(`   Description: ${autopilot.description}`);
      log(`   Integration: ${autopilot.integration}`);
    }
  }

  return results;
}

async function checkPackageJsonIntegration() {
  section('📦 PACKAGE.JSON INTEGRATION');

  const packageJson = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf-8'));

  const autopilotScripts = Object.entries(packageJson.scripts || {}).filter(([key]) =>
    key.includes('autopilot'),
  );

  if (autopilotScripts.length > 0) {
    log('✅ Autopilot scripts found:', 'green');
    autopilotScripts.forEach(([key, value]) => {
      log(`   ${key}: ${value}`);
    });
  } else {
    log('⚠️  No autopilot scripts in package.json', 'yellow');
  }

  // Check postbuild integration
  const postbuild = packageJson.scripts?.postbuild;
  if (postbuild) {
    log('✅ Postbuild hook configured:', 'green');
    const steps = postbuild.split('&&').map((s) => s.trim());
    steps.forEach((step, i) => {
      log(`   ${i + 1}. ${step}`);
    });
  } else {
    log('❌ No postbuild hook found', 'red');
  }
}

async function checkEnvironmentVariables() {
  section('🌍 ENVIRONMENT VARIABLES');

  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
  ];

  const optionalVars = [
    'ORCHESTRATOR_URL',
    'ANALYZER_URL',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
  ];

  log('Required Variables:', 'cyan');
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✅ ${varName}: SET`, 'green');
    } else {
      log(`❌ ${varName}: NOT SET`, 'red');
    }
  }

  log('Optional Variables (for advanced autopilots):', 'cyan');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log(`✅ ${varName}: SET`, 'green');
    } else {
      log(`⚠️  ${varName}: NOT SET`, 'yellow');
    }
  }
}

async function generateReport(results) {
  section('📊 SUMMARY REPORT');

  log(
    `Total Autopilots: ${results.active.length + results.configured.length + results.missing.length + results.notExecutable.length}`,
  );
  log(`✅ Active (integrated in build): ${results.active.length}`, 'green');
  log(`🔧 Configured (manual run): ${results.configured.length}`, 'blue');
  log(`⚠️  Not Executable: ${results.notExecutable.length}`, 'yellow');
  log(`❌ Missing: ${results.missing.length}`, 'red');

  if (results.active.length > 0) {
    log('Active Autopilots (run automatically):', 'green');
    results.active.forEach((ap) => {
      log(`  • ${ap.name} - ${ap.description}`);
    });
  }

  if (results.configured.length > 0) {
    log('Configured Autopilots (manual run):', 'blue');
    results.configured.forEach((ap) => {
      log(`  • ${ap.name} - ${ap.description}`);
    });
  }

  if (results.notExecutable.length > 0) {
    log('⚠️  Fix Required - Not Executable:', 'yellow');
    results.notExecutable.forEach((ap) => {
      log(`  • ${ap.file}`);
      log(`    Run: chmod +x ${ap.file}`);
    });
  }

  if (results.missing.length > 0) {
    log('❌ Missing Autopilots:', 'red');
    results.missing.forEach((ap) => {
      log(`  • ${ap.name} - ${ap.file}`);
    });
  }

  // Recommendations
  section('💡 RECOMMENDATIONS');

  if (results.notExecutable.length > 0) {
    log('1. Make shell scripts executable:', 'yellow');
    log('   chmod +x scripts/*.sh');
  }

  if (!process.env.ORCHESTRATOR_URL) {
    log('2. Optional: Set up orchestrator for advanced autopilots:', 'blue');
    log('   export ORCHESTRATOR_URL=https://your-orchestrator.workers.dev');
  }

  log('3. Active autopilots run automatically during build:', 'green');
  log('   pnpm build');

  log('4. Manual autopilots can be run as needed:', 'blue');
  log('   node scripts/routes-autopilot.mjs');
  log('   bash scripts/advanced-autopilot.sh');
}

async function main() {
  try {
    const results = await checkAutopilots();
    await checkPackageJsonIntegration();
    await checkEnvironmentVariables();
    await generateReport(results);

    log('\n✅ Autopilot check complete!', 'green');

    // Exit with error if there are missing autopilots
    if (results.missing.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
