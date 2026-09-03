#!/usr/bin/env node
/**
 * Comprehensive LMS Health Check
 *
 * Checks:
 * - Database migrations
 * - Frontend components
 * - Workers configuration
 * - Dependencies
 * - File structure
 * - Git status
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCallback);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(70), 'cyan');
}

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

function check(name, status, message, severity = 'info') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';

  log(`${icon} ${name}: ${message}`, color);

  results.checks.push({ name, status, message, severity });

  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.warnings++;
}

async function checkDatabase() {
  section('📊 Database Health Check');

  try {
    const migrationsDir = path.join(ROOT, 'supabase/migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));

    check('Database Migrations', 'pass', `${sqlFiles.length} migration files found`);

    // Check for required migrations
    const required = [
      '010_complete_lms_schema.sql',
      '014_milady_cima_integration.sql',
      '015_exec_sql_rpc.sql',
      '016_ojt_enhancements.sql',
      '20251015_grade_book.sql',
      '20251015_quiz_system.sql',
      '20251015_live_classes.sql',
      '20251015_notification_center.sql',
    ];

    for (const file of required) {
      if (sqlFiles.includes(file)) {
        check(`Migration: ${file}`, 'pass', 'Found');
      } else {
        check(`Migration: ${file}`, 'fail', 'Missing', 'critical');
      }
    }

    // Count tables in migrations
    let totalTables = 0;
    for (const file of sqlFiles) {
      const content = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
      const matches = content.match(/CREATE TABLE/gi);
      if (matches) totalTables += matches.length;
    }

    if (totalTables >= 60) {
      check('Database Tables', 'pass', `${totalTables} tables defined`);
    } else {
      check('Database Tables', 'warn', `Only ${totalTables} tables (expected 60+)`);
    }
  } catch (err) {
    check('Database Check', 'fail', err.message, 'critical');
  }
}

async function checkFrontend() {
  section('🎨 Frontend Health Check');

  try {
    const pagesDir = path.join(ROOT, 'src/pages');
    const files = await fs.readdir(pagesDir);
    const pages = files.filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

    check('Frontend Pages', 'pass', `${pages.length} pages found`);

    // Check for required pages
    const required = [
      'StudentDashboard.jsx',
      'OJTTimesheet.jsx',
      'MentorPortal.jsx',
      'MentorSign.jsx',
      'AdminRTI.jsx',
      'GradeBook.jsx',
      'QuizBuilder.jsx',
      'LiveClassSchedule.jsx',
      'NotificationCenter.jsx',
    ];

    for (const page of required) {
      if (pages.includes(page)) {
        check(`Page: ${page}`, 'pass', 'Found');
      } else {
        check(`Page: ${page}`, 'fail', 'Missing', 'high');
      }
    }

    // Check components directory
    const componentsDir = path.join(ROOT, 'src/components');
    const components = await fs.readdir(componentsDir);
    check('Components', 'pass', `${components.length} components found`);

    // Check layouts
    const layoutsDir = path.join(ROOT, 'src/layouts');
    const layouts = await fs.readdir(layoutsDir);
    check('Layouts', 'pass', `${layouts.length} layouts found`);
  } catch (err) {
    check('Frontend Check', 'fail', err.message, 'critical');
  }
}

async function checkWorkers() {
  section('⚡ Workers Health Check');

  try {
    const workersDir = path.join(ROOT, 'workers');
    const dirs = await fs.readdir(workersDir);

    const workers = [];
    for (const dir of dirs) {
      const stat = await fs.stat(path.join(workersDir, dir));
      if (stat.isDirectory()) {
        const hasWrangler = await fs
          .access(path.join(workersDir, dir, 'wrangler.toml'))
          .then(() => true)
          .catch(() => false);
        if (hasWrangler) workers.push(dir);
      }
    }

    check('Workers Found', 'pass', `${workers.length} workers configured`);

    // Check for required workers
    const required = [
      'cima-importer',
      'grade-book',
      'quiz-system',
      'live-classes',
      'notification-center',
    ];

    for (const worker of required) {
      if (workers.includes(worker)) {
        // Check wrangler.toml
        const wranglerPath = path.join(workersDir, worker, 'wrangler.toml');
        const content = await fs.readFile(wranglerPath, 'utf-8');

        if (content.includes('name =')) {
          check(`Worker: ${worker}`, 'pass', 'Configured');
        } else {
          check(`Worker: ${worker}`, 'warn', 'Missing name in wrangler.toml');
        }
      } else {
        check(`Worker: ${worker}`, 'fail', 'Missing', 'high');
      }
    }
  } catch (err) {
    check('Workers Check', 'fail', err.message, 'critical');
  }
}

async function checkDependencies() {
  section('📦 Dependencies Health Check');

  try {
    // Check package.json
    const packagePath = path.join(ROOT, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));

    check('package.json', 'pass', 'Found');

    // Check for required dependencies
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const required = {
      react: 'Frontend framework',
      'react-dom': 'React DOM',
      'react-router-dom': 'Routing',
      '@supabase/supabase-js': 'Database client',
      recharts: 'Charts',
      tailwindcss: 'Styling',
    };

    for (const [dep, desc] of Object.entries(required)) {
      if (deps[dep]) {
        check(`Dependency: ${dep}`, 'pass', `${desc} (${deps[dep]})`);
      } else {
        check(`Dependency: ${dep}`, 'warn', `${desc} not found`);
      }
    }

    // Check node_modules
    const nodeModulesExists = await fs
      .access(path.join(ROOT, 'node_modules'))
      .then(() => true)
      .catch(() => false);

    if (nodeModulesExists) {
      check('node_modules', 'pass', 'Dependencies installed');
    } else {
      check('node_modules', 'warn', 'Run npm install');
    }
  } catch (err) {
    check('Dependencies Check', 'fail', err.message, 'high');
  }
}

async function checkFileStructure() {
  section('📁 File Structure Health Check');

  try {
    const requiredDirs = [
      'src',
      'src/pages',
      'src/components',
      'src/layouts',
      'src/contexts',
      'supabase/migrations',
      'workers',
      'public',
    ];

    for (const dir of requiredDirs) {
      const exists = await fs
        .access(path.join(ROOT, dir))
        .then(() => true)
        .catch(() => false);

      if (exists) {
        check(`Directory: ${dir}`, 'pass', 'Exists');
      } else {
        check(`Directory: ${dir}`, 'fail', 'Missing', 'critical');
      }
    }

    // Check for required files
    const requiredFiles = ['package.json', 'vite.config.js', 'index.html', 'README.md'];

    for (const file of requiredFiles) {
      const exists = await fs
        .access(path.join(ROOT, file))
        .then(() => true)
        .catch(() => false);

      if (exists) {
        check(`File: ${file}`, 'pass', 'Exists');
      } else {
        check(`File: ${file}`, 'warn', 'Missing');
      }
    }
  } catch (err) {
    check('File Structure Check', 'fail', err.message, 'critical');
  }
}

async function checkGit() {
  section('🔧 Git Health Check');

  try {
    // Check if git repo
    const { stdout: isRepo } = await exec('git rev-parse --is-inside-work-tree');
    check('Git Repository', 'pass', 'Initialized');

    // Check current branch
    const { stdout: branch } = await exec('git branch --show-current');
    check('Current Branch', 'pass', branch.trim());

    // Check for uncommitted changes
    const { stdout: status } = await exec('git status --porcelain');
    if (status.trim()) {
      const lines = status.trim().split('\n').length;
      check('Git Status', 'warn', `${lines} uncommitted changes`);
    } else {
      check('Git Status', 'pass', 'Clean working directory');
    }

    // Check last commit
    const { stdout: lastCommit } = await exec('git log -1 --oneline');
    check('Last Commit', 'pass', lastCommit.trim());

    // Check remote
    const { stdout: remote } = await exec('git remote -v');
    if (remote.includes('github.com')) {
      check('Git Remote', 'pass', 'GitHub configured');
    } else {
      check('Git Remote', 'warn', 'No GitHub remote');
    }
  } catch (err) {
    check('Git Check', 'warn', 'Not a git repository or git not available');
  }
}

async function checkDocumentation() {
  section('📚 Documentation Health Check');

  try {
    const docs = [
      'COMPLETE_DEPLOYMENT_GUIDE.md',
      'DEPLOYMENT_READY.md',
      'DEPLOYMENT_COMPLETE.md',
      'LMS_COMPLETE_ANALYSIS.md',
      'SYSTEM_STATUS.md',
      'AUTOPILOT_FIX_REPORT.md',
      'FINAL_DEPLOYMENT_SUMMARY.md',
      'LMS_VALUE_ASSESSMENT.md',
    ];

    for (const doc of docs) {
      const exists = await fs
        .access(path.join(ROOT, doc))
        .then(() => true)
        .catch(() => false);

      if (exists) {
        check(`Doc: ${doc}`, 'pass', 'Available');
      } else {
        check(`Doc: ${doc}`, 'warn', 'Missing');
      }
    }
  } catch (err) {
    check('Documentation Check', 'fail', err.message);
  }
}

async function generateReport() {
  section('📊 Health Check Summary');

  const total = results.passed + results.failed + results.warnings;
  const score = Math.round((results.passed / total) * 100);

  log(`\nTotal Checks: ${total}`);
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`⚠️  Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'reset');
  log(`\nHealth Score: ${score}%`, score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red');

  // Determine overall status
  let status, statusColor, statusIcon;
  if (results.failed === 0 && results.warnings === 0) {
    status = 'EXCELLENT';
    statusColor = 'green';
    statusIcon = '🎉';
  } else if (results.failed === 0) {
    status = 'GOOD';
    statusColor = 'green';
    statusIcon = '✅';
  } else if (results.failed <= 3) {
    status = 'NEEDS ATTENTION';
    statusColor = 'yellow';
    statusIcon = '⚠️';
  } else {
    status = 'CRITICAL';
    statusColor = 'red';
    statusIcon = '❌';
  }

  log(`\nOverall Status: ${statusIcon} ${status}`, statusColor);

  // Critical issues
  const critical = results.checks.filter((c) => c.status === 'fail' && c.severity === 'critical');
  if (critical.length > 0) {
    log('\n🚨 Critical Issues:', 'red');
    critical.forEach((c) => log(`   - ${c.name}: ${c.message}`, 'red'));
  }

  // High priority issues
  const high = results.checks.filter((c) => c.status === 'fail' && c.severity === 'high');
  if (high.length > 0) {
    log('\n⚠️  High Priority Issues:', 'yellow');
    high.forEach((c) => log(`   - ${c.name}: ${c.message}`, 'yellow'));
  }

  // Generate markdown report
  const report = `# LMS Health Check Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Checks:** ${total}
- **Passed:** ${results.passed} ✅
- **Failed:** ${results.failed} ❌
- **Warnings:** ${results.warnings} ⚠️
- **Health Score:** ${score}%
- **Overall Status:** ${statusIcon} ${status}

## Detailed Results

${results.checks
  .map((c) => {
    const icon = c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '⚠️';
    return `### ${icon} ${c.name}\n- **Status:** ${c.status}\n- **Message:** ${c.message}\n${c.severity ? `- **Severity:** ${c.severity}\n` : ''}`;
  })
  .join('\n\n')}

${critical.length > 0 ? `## 🚨 Critical Issues\n\n${critical.map((c) => `- **${c.name}:** ${c.message}`).join('\n')}` : ''}

${high.length > 0 ? `## ⚠️ High Priority Issues\n\n${high.map((c) => `- **${c.name}:** ${c.message}`).join('\n')}` : ''}

## Recommendations

${
  results.failed === 0 && results.warnings === 0
    ? '✅ System is in excellent health! Ready for production deployment.'
    : results.failed === 0
      ? '✅ System is healthy with minor warnings. Address warnings before production.'
      : results.failed <= 3
        ? '⚠️ System needs attention. Fix critical and high priority issues before deployment.'
        : '❌ System has critical issues. Do not deploy until all critical issues are resolved.'
}

## Next Steps

${
  results.failed > 0
    ? `
1. Fix all critical issues immediately
2. Address high priority issues
3. Re-run health check
4. Proceed with deployment when all checks pass
`
    : results.warnings > 0
      ? `
1. Review and address warnings
2. Run final health check
3. Proceed with deployment
`
      : `
1. Run database migrations
2. Set worker secrets
3. Deploy workers
4. Deploy frontend
5. Test complete system
`
}

---

Generated by LMS Health Check Script
`;

  await fs.writeFile(path.join(ROOT, 'HEALTH_CHECK_REPORT.md'), report);
  log('\n📄 Report saved to HEALTH_CHECK_REPORT.md', 'cyan');

  return { score, status, total, ...results };
}

async function main() {
  try {
    log('\n🏥 Starting LMS Health Check', 'bright');
    log('This will verify all system components\n');

    await checkDatabase();
    await checkFrontend();
    await checkWorkers();
    await checkDependencies();
    await checkFileStructure();
    await checkGit();
    await checkDocumentation();

    const summary = await generateReport();

    section('🎯 Health Check Complete');

    if (summary.failed === 0) {
      log('\n✅ All checks passed! System is healthy.', 'green');
      process.exit(0);
    } else {
      log(`\n⚠️  ${summary.failed} checks failed. Review HEALTH_CHECK_REPORT.md`, 'yellow');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Health check failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
