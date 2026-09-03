#!/usr/bin/env npx ts-node
/**
 * Avatar Route Audit Script
 *
 * Produces a machine-readable report:
 * - Which routes speak
 * - Which routes are silent (intentionally)
 * - Which routes are misconfigured (bug)
 *
 * Run: npx ts-node scripts/audit-avatar-routes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Import avatar config (adjust path as needed for ts-node)
const APP_DIR = path.join(process.cwd(), 'app');

interface AuditResult {
  route: string;
  enabled: boolean;
  speakOnLoad: boolean;
  pageType: string;
  status: 'SPEAKS_ON_LOAD' | 'INTENTIONAL_SILENCE' | 'MISCONFIGURED' | 'NO_CONFIG';
  message?: string;
}

// Known silent patterns (intentional)
const SILENT_PATTERNS = [
  /^\/api/,
  /^\/auth/,
  /^\/login/,
  /^\/signup/,
  /^\/privacy/,
  /^\/terms/,
  /^\/policies/,
  /^\/governance/,
  /^\/accessibility/,
  /^\/assignments/,
  /^\/tests/,
  /^\/quiz/,
  /^\/exam/,
  /^\/sitemap/,
  /^\/404/,
  /^\/500/,
];

// Known speaking patterns
const SPEAKING_PATTERNS = [
  { pattern: /^\/$/, pageType: 'home' },
  { pattern: /^\/programs$/, pageType: 'programIndex' },
  { pattern: /^\/programs\//, pageType: 'programDetail' },
  { pattern: /^\/apply/, pageType: 'enroll' },
  { pattern: /^\/enroll/, pageType: 'enroll' },
  { pattern: /^\/wioa/, pageType: 'enroll' },
  { pattern: /^\/student-portal$/, pageType: 'dashboard' },
  { pattern: /^\/student-portal\/progress/, pageType: 'progress' },
  { pattern: /^\/student-portal\/hours/, pageType: 'progress' },
  { pattern: /^\/instructor/, pageType: 'dashboard' },
  { pattern: /^\/admin\/staff-portal/, pageType: 'dashboard' },
  { pattern: /^\/store\/licenses/, pageType: 'licensing' },
  { pattern: /^\/government/, pageType: 'licensing' },
  { pattern: /^\/store\/checkout/, pageType: 'enroll' },
];

function getRouteStatus(route: string): AuditResult {
  const normalizedRoute = route.toLowerCase().replace(/\/$/, '') || '/';

  // Check if intentionally silent
  if (SILENT_PATTERNS.some((p) => p.test(normalizedRoute))) {
    return {
      route,
      enabled: false,
      speakOnLoad: false,
      pageType: 'silent',
      status: 'INTENTIONAL_SILENCE',
    };
  }

  // Check if should speak
  const speakingMatch = SPEAKING_PATTERNS.find((p) => p.pattern.test(normalizedRoute));
  if (speakingMatch) {
    return {
      route,
      enabled: true,
      speakOnLoad: true,
      pageType: speakingMatch.pageType,
      status: 'SPEAKS_ON_LOAD',
    };
  }

  // Check for common pages that might be misconfigured
  const shouldProbablySpeak = [
    /^\/about/,
    /^\/contact/,
    /^\/careers/,
    /^\/funding/,
    /^\/testimonials/,
  ];

  if (shouldProbablySpeak.some((p) => p.test(normalizedRoute))) {
    return {
      route,
      enabled: false,
      speakOnLoad: false,
      pageType: 'unknown',
      status: 'MISCONFIGURED',
      message: 'Marketing page without avatar config - consider adding',
    };
  }

  // Default: no config (might be intentional for minor pages)
  return {
    route,
    enabled: false,
    speakOnLoad: false,
    pageType: 'none',
    status: 'NO_CONFIG',
  };
}

function findAllRoutes(dir: string, basePath: string = ''): string[] {
  const routes: string[] = [];

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;

      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Skip dynamic route segments for now
        if (item.name.startsWith('[')) continue;
        if (item.name === 'api') continue;

        const newBasePath = `${basePath}/${item.name}`;
        routes.push(...findAllRoutes(fullPath, newBasePath));
      } else if (item.name === 'page.tsx') {
        routes.push(basePath || '/');
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }

  return routes;
}

function runAudit() {
  console.log('🔍 Avatar Route Audit\n');
  console.log('='.repeat(60));

  const routes = findAllRoutes(APP_DIR);
  console.log(`\nScanning ${routes.length} routes...\n`);

  const results: AuditResult[] = routes.map(getRouteStatus);

  // Categorize results
  const speaking = results.filter((r) => r.status === 'SPEAKS_ON_LOAD');
  const silent = results.filter((r) => r.status === 'INTENTIONAL_SILENCE');
  const misconfigured = results.filter((r) => r.status === 'MISCONFIGURED');
  const noConfig = results.filter((r) => r.status === 'NO_CONFIG');

  // Report
  console.log('✅ ROUTES THAT SPEAK ON LOAD');
  console.log('-'.repeat(40));
  for (const r of speaking) {
    console.log(`  ${r.route} (${r.pageType})`);
  }

  console.log('\n🔇 INTENTIONALLY SILENT ROUTES');
  console.log('-'.repeat(40));
  for (const r of silent) {
    console.log(`  ${r.route}`);
  }

  if (misconfigured.length > 0) {
    console.log('\n⚠️  POTENTIALLY MISCONFIGURED (review these)');
    console.log('-'.repeat(40));
    for (const r of misconfigured) {
      console.log(`  ${r.route}`);
      if (r.message) console.log(`    → ${r.message}`);
    }
  }

  console.log('\n📊 NO CONFIG (minor pages, likely OK)');
  console.log('-'.repeat(40));
  console.log(`  ${noConfig.length} routes without avatar config`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(40));
  console.log(`  Total routes: ${results.length}`);
  console.log(`  Speaking: ${speaking.length}`);
  console.log(`  Silent (intentional): ${silent.length}`);
  console.log(`  Misconfigured: ${misconfigured.length}`);
  console.log(`  No config: ${noConfig.length}`);
  console.log('='.repeat(60));

  // Write JSON report
  const reportPath = path.join(process.cwd(), 'avatar-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report written to: ${reportPath}`);

  // Exit with error if misconfigured
  if (misconfigured.length > 0) {
    console.log(`\n⚠️  ${misconfigured.length} routes may need avatar config`);
    process.exit(1);
  } else {
    console.log('\n✅ All routes properly configured!');
    process.exit(0);
  }
}

runAudit();
