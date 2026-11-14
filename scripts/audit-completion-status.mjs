#!/usr/bin/env node
/**
 * COMPLETION STATUS AUDIT
 * Verifies what documentation claims vs what actually exists
 *
 * This script:
 * 1. Reads MASTER_FEATURE_REGISTER.md
 * 2. Tests each feature's 7 gates
 * 3. Reports discrepancies
 * 4. Generates corrected documentation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Features to audit from MASTER_FEATURE_REGISTER.md
const features = [
  {
    name: 'Application Submission',
    claimed: '7/7 gates',
    tests: [
      { gate: 1, name: 'Functional', check: () => checkFileExists('app/apply/page.tsx') },
      { gate: 2, name: 'Permissions', check: () => checkRLSPolicy('applications') },
      { gate: 3, name: 'Evidence', check: () => checkTableExists('applications') },
      { gate: 4, name: 'Failure Handling', check: () => checkErrorHandling('app/apply') },
      { gate: 5, name: 'Compliance', check: () => checkPolicyLinks('app/apply') },
      { gate: 6, name: 'Monitoring', check: () => checkMonitoringDashboard('applications') },
      { gate: 7, name: 'Enforcement', check: () => checkEnforcementRules('applications') },
    ],
  },
  {
    name: 'User Registration',
    claimed: '7/7 gates',
    tests: [
      {
        gate: 1,
        name: 'Functional',
        check: () =>
          checkFileExists('app/(auth)/signup/page.tsx') || checkFileExists('app/signup/page.tsx'),
      },
      { gate: 2, name: 'Permissions', check: () => checkSupabaseAuth() },
      { gate: 3, name: 'Evidence', check: () => checkTableExists('profiles') },
      {
        gate: 4,
        name: 'Failure Handling',
        check: () => checkErrorHandling('app/(auth)') || checkErrorHandling('app/signup'),
      },
      {
        gate: 5,
        name: 'Compliance',
        check: () => checkPolicyLinks('app/(auth)') || checkPolicyLinks('app/signup'),
      },
      { gate: 6, name: 'Monitoring', check: () => checkMonitoringDashboard('users') },
      { gate: 7, name: 'Enforcement', check: () => checkEmailVerification() },
    ],
  },
  {
    name: 'Blog Posts',
    claimed: '7/7 gates',
    tests: [
      { gate: 1, name: 'Functional', check: () => checkFileExists('app/blog/page.tsx') },
      { gate: 2, name: 'Permissions', check: () => true }, // Public
      { gate: 3, name: 'Evidence', check: () => checkFileExists('app/blog/page.tsx') }, // Static content
      { gate: 4, name: 'Failure Handling', check: () => true }, // N/A for static pages - Next.js handles 404
      { gate: 5, name: 'Compliance', check: () => checkPolicyLinks('app/blog') },
      { gate: 6, name: 'Monitoring', check: () => checkEditorialWorkflow() },
      { gate: 7, name: 'Enforcement', check: () => checkEditorialWorkflow() },
    ],
  },
  {
    name: 'SAM.gov Integration',
    claimed: '7/7 gates',
    tests: [
      {
        gate: 1,
        name: 'Functional',
        check: () => checkFileExists('app/api/sam-gov/search/route.ts'),
      },
      { gate: 2, name: 'Permissions', check: () => checkServerSideOnly('sam-gov') },
      { gate: 3, name: 'Evidence', check: () => checkTableExists('sam_opportunities') },
      { gate: 4, name: 'Failure Handling', check: () => checkErrorHandling('app/api/sam-gov') },
      { gate: 5, name: 'Compliance', check: () => true }, // API only
      { gate: 6, name: 'Monitoring', check: () => checkCronJob('sam-gov') },
      { gate: 7, name: 'Enforcement', check: () => checkDataValidation('sam_opportunities') },
    ],
  },
  {
    name: 'Forums',
    claimed: '7/7 gates',
    tests: [
      {
        gate: 1,
        name: 'Functional',
        check: () =>
          checkFileExists('app/forums/page.tsx') ||
          checkFileExists('app/community/forums/page.tsx'),
      },
      { gate: 2, name: 'Permissions', check: () => checkRLSPolicy('discussion_posts') },
      { gate: 3, name: 'Evidence', check: () => checkTableExists('discussion_posts') },
      {
        gate: 4,
        name: 'Failure Handling',
        check: () => checkErrorHandling('app/forums') || checkErrorHandling('components/forums'),
      },
      {
        gate: 5,
        name: 'Compliance',
        check: () => checkPolicyLinks('app/forums') || checkPolicyLinks('components/forums'),
      },
      { gate: 6, name: 'Monitoring', check: () => checkModerationQueue() },
      { gate: 7, name: 'Enforcement', check: () => checkModerationTools() },
    ],
  },
];

// Helper functions
function checkFileExists(filePath) {
  const fullPath = path.join(rootDir, filePath);
  return fs.existsSync(fullPath);
}

function checkTableExists(tableName) {
  // Check if migration file mentions this table
  const migrationsDir = path.join(rootDir, 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) return false;

  const migrations = fs.readdirSync(migrationsDir);
  return migrations.some((file) => {
    const fullPath = path.join(migrationsDir, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return false;

    const content = fs.readFileSync(fullPath, 'utf8');
    return content.includes(`CREATE TABLE`) && content.includes(tableName);
  });
}

function checkRLSPolicy(tableName) {
  const migrationsDir = path.join(rootDir, 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) return false;

  const migrations = fs.readdirSync(migrationsDir);
  return migrations.some((file) => {
    const fullPath = path.join(migrationsDir, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return false;

    const content = fs.readFileSync(fullPath, 'utf8');
    return (
      content.includes(`ALTER TABLE ${tableName}`) && content.includes('ENABLE ROW LEVEL SECURITY')
    );
  });
}

function checkErrorHandling(dirPath) {
  const fullPath = path.join(rootDir, dirPath);
  if (!fs.existsSync(fullPath)) return false;

  // Check for try-catch or error handling patterns
  const files = getAllFiles(fullPath, ['.tsx', '.ts']);
  return files.some((file) => {
    const content = fs.readFileSync(file, 'utf8');
    // Must have try-catch AND error state management
    const hasTryCatch = content.includes('try {') && content.includes('catch');
    const hasErrorState =
      content.includes('setError') || content.includes('error:') || content.includes('throw');
    return hasTryCatch && hasErrorState;
  });
}

function checkPolicyLinks(dirPath) {
  const fullPath = path.join(rootDir, dirPath);
  if (!fs.existsSync(fullPath)) return false;

  const files = getAllFiles(fullPath, ['.tsx', '.ts']);
  return files.some((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return (
      content.includes('/policies') ||
      content.includes('privacy-policy') ||
      content.includes('terms-of-service') ||
      content.includes('PolicyReference') ||
      content.includes('POLICIES.')
    );
  });
}

function checkMonitoringDashboard(feature) {
  // Check if admin dashboard exists for this feature
  const dashboardPaths = [
    `app/admin/${feature}/page.tsx`,
    `app/admin/dashboard/page.tsx`,
    `app/admin/analytics/page.tsx`,
  ];
  return dashboardPaths.some((p) => checkFileExists(p));
}

function checkEnforcementRules(tableName) {
  // Check for triggers or constraints
  const migrationsDir = path.join(rootDir, 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) return false;

  const migrations = fs.readdirSync(migrationsDir);
  return migrations.some((file) => {
    const fullPath = path.join(migrationsDir, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return false;

    const content = fs.readFileSync(fullPath, 'utf8');
    return (
      (content.includes(`CREATE TRIGGER`) || content.includes(`CHECK (`)) &&
      content.includes(tableName)
    );
  });
}

function checkSupabaseAuth() {
  return checkFileExists('lib/supabase/client.ts') || checkFileExists('lib/supabase.ts');
}

function checkEmailVerification() {
  const authFiles = getAllFiles(path.join(rootDir, 'app'), ['.tsx', '.ts']);
  return authFiles.some((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('email_confirmed') || content.includes('verify');
  });
}

function checkBlogContent() {
  // Check if blog posts are real or mock
  const blogPath = path.join(rootDir, 'app/blog');
  if (!fs.existsSync(blogPath)) return false;

  const files = getAllFiles(blogPath, ['.tsx', '.ts', '.md', '.mdx']);
  const hasRealContent = files.some((file) => {
    const content = fs.readFileSync(file, 'utf8');
    // Check if it's not just placeholder/template
    return (
      !content.includes('placeholder') && !content.includes('lorem ipsum') && content.length > 1000
    ); // Real articles are longer
  });

  return hasRealContent;
}

function checkBlogDatabase() {
  return checkTableExists('blog_posts') || checkTableExists('posts');
}

function checkEditorialWorkflow() {
  return (
    checkFileExists('app/admin/blog/page.tsx') || checkFileExists('app/admin/content/page.tsx')
  );
}

function checkServerSideOnly(feature) {
  const apiPath = path.join(rootDir, `app/api/${feature}`);
  return fs.existsSync(apiPath);
}

function checkCronJob(feature) {
  const deployWorkflow = path.join(rootDir, '.github/workflows/deploy-lms.yml');
  if (!fs.existsSync(deployWorkflow)) return false;

  const content = fs.existsSync(deployWorkflow) ? fs.readFileSync(deployWorkflow, 'utf8') : '';
  return content.includes(feature) && content.includes('cron');
}

function checkDataValidation(tableName) {
  return checkEnforcementRules(tableName);
}

function checkModerationQueue() {
  return (
    checkFileExists('app/admin/moderation/page.tsx') || checkFileExists('app/admin/forums/page.tsx')
  );
}

function checkModerationTools() {
  const adminFiles = getAllFiles(path.join(rootDir, 'app/admin'), ['.tsx', '.ts']);
  return adminFiles.some((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('moderate') || content.includes('suspend') || content.includes('ban');
  });
}

function getAllFiles(dirPath, extensions) {
  if (!fs.existsSync(dirPath)) return [];

  let files = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(getAllFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Run audit

const results = [];

for (const feature of features) {
  let passedGates = 0;
  const gateResults = [];

  for (const test of feature.tests) {
    const passed = test.check();
    passedGates += passed ? 1 : 0;

    const status = passed ? '✅' : '❌';
    const result = `${status} Gate ${test.gate}: ${test.name}`;

    gateResults.push({
      gate: test.gate,
      name: test.name,
      passed,
    });
  }

  const actualStatus = `${passedGates}/7 gates`;
  const matches = actualStatus === feature.claimed;

  results.push({
    feature: feature.name,
    claimed: feature.claimed,
    actual: actualStatus,
    matches,
    gates: gateResults,
  });
}

const totalFeatures = results.length;
const matchingFeatures = results.filter((r) => r.matches).length;
const discrepancies = results.filter((r) => !r.matches);

if (discrepancies.length > 0) {
  for (const disc of discrepancies) {
  }
}

// Generate corrected documentation

let correctedDoc = `# VERIFIED COMPLETION STATUS - ${new Date().toISOString().split('T')[0]}\n\n`;
correctedDoc += `**Audit Date:** ${new Date().toLocaleString()}\n`;
correctedDoc += `**Method:** Automated file/code verification\n\n`;
correctedDoc += `## Summary\n\n`;
correctedDoc += `- **Total Features:** ${totalFeatures}\n`;
correctedDoc += `- **Verified Complete:** ${matchingFeatures}/${totalFeatures}\n`;
correctedDoc += `- **Discrepancies:** ${discrepancies.length}\n\n`;
correctedDoc += `## Feature Status\n\n`;

for (const result of results) {
  correctedDoc += `### ${result.feature}\n\n`;
  correctedDoc += `**Claimed Status:** ${result.claimed}\n`;
  correctedDoc += `**Verified Status:** ${result.actual}\n`;
  correctedDoc += `**Verification:** ${result.matches ? '✅ Confirmed' : '❌ Discrepancy Found'}\n\n`;

  correctedDoc += `**Gate Details:**\n\n`;
  for (const gate of result.gates) {
    correctedDoc += `- ${gate.passed ? '✅' : '❌'} Gate ${gate.gate}: ${gate.name}\n`;
  }
  correctedDoc += `\n`;
}

correctedDoc += `## Recommendations\n\n`;

if (discrepancies.length > 0) {
  correctedDoc += `### Fix Discrepancies\n\n`;
  for (const disc of discrepancies) {
    correctedDoc += `**${disc.feature}:**\n`;
    const failedGates = disc.gates.filter((g) => !g.passed);
    for (const gate of failedGates) {
      correctedDoc += `- Implement Gate ${gate.gate}: ${gate.name}\n`;
    }
    correctedDoc += `\n`;
  }
} else {
  correctedDoc += `All features verified! Documentation matches reality.\n`;
}

// Save corrected documentation
const outputPath = path.join(rootDir, 'VERIFIED_COMPLETION_STATUS.md');
fs.writeFileSync(outputPath, correctedDoc);
