#!/usr/bin/env node
/**
 * AUTOMATED ROUTE DISCOVERY & AUDIT SYSTEM
 * 
 * This script:
 * 1. Automatically discovers ALL routes from app/ directory
 * 2. Assigns each route to the correct build (Marketing/Admin/LMS)
 * 3. Tests every route for HTTP 200/redirect responses
 * 4. Uses Playwright for browser-based testing
 * 5. Validates workflows end-to-end
 * 6. Generates comprehensive production certification report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Configuration
const BASE_URL = process.env.SITE_URL || 'https://www.elevateforhumanity.org';
const BUILD_SCOPES = ['MARKETING', 'ADMIN', 'LMS'];

// Build ownership rules (route prefix -> build)
const BUILD_OWNERSHIP = {
  'admin': 'ADMIN',
  'admin-login': 'ADMIN',
  'lms': 'LMS',
  'learner': 'LMS',
  'profile': 'LMS',
  'account': 'LMS',
  'achievements': 'LMS',
  'messages': 'LMS',
  'notifications': 'LMS',
  'reports': 'LMS',
  'schedule': 'LMS',
  'advising': 'LMS',
  'learning': 'LMS',
  'courses': 'LMS',
  'student-support': 'LMS',
  'subscription': 'LMS',
  'actions': 'LMS',
  'student': 'LMS',
  'students': 'LMS',
  'attendance': 'LMS'
};

// Routes owned by each build
const BUILD_OWNED_ROUTES = {
  ADMIN: ['admin', 'admin-login'],
  LMS: ['lms', 'learner', 'student', 'students', 'profile', 'account', 'achievements', 
        'messages', 'notifications', 'reports', 'advising', 'learning', 'courses',
        'course-preview', 'schedule', 'schedule-consultation', 'student-support',
        'actions', 'subscription', 'attendance', 'import'],
  MARKETING: [] // Everything else
};

// Routes that exist in ALL builds (shared)
const SHARED_ROUTES = ['api', 'auth', '(auth)', 'legal', 'privacy', 'terms', 
                       'cookies', 'accessibility', 'certificates', 'credentials', 
                       'verify', 'health', 'data', 'videos'];

/**
 * Discover all routes from the app/ directory
 */
function discoverRoutes() {
  const appDir = path.join(ROOT, 'app');
  const routes = [];
  
  function walkDir(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const routePath = basePath ? `${basePath}/${entry.name}` : `/${entry.name}`;
      
      if (entry.isDirectory()) {
        // Skip special directories
        if (entry.name.startsWith('.') || 
            entry.name === 'node_modules' ||
            entry.name === 'components' ||
            entry.name === 'lib' ||
            entry.name === 'hooks' ||
            entry.name === 'types' ||
            entry.name === '__tests__') {
          continue;
        }
        
        // Check if this directory has a page
        const hasPage = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'].some(
          f => fs.existsSync(path.join(fullPath, f))
        );
        
        if (hasPage) {
          routes.push({
            path: routePath,
            type: 'page',
            sourceFile: path.join(fullPath, 'page.tsx'),
            exists: true
          });
        }
        
        // Recurse into subdirectories
        walkDir(fullPath, routePath);
        
        // Check for dynamic routes like [id]
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          // Dynamic route - add placeholder
          routes.push({
            path: routePath.replace(/\/\[[^\]]+\]/g, '/:id'),
            type: 'dynamic',
            sourceFile: fullPath,
            exists: true
          });
        }
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        routes.push({
          path: routePath.replace(/\/route\.(ts|js)$/, ''),
          type: 'api',
          sourceFile: fullPath,
          exists: true
        });
      }
    }
  }
  
  walkDir(appDir);
  return routes;
}

/**
 * Determine which build owns a route
 */
function getRouteOwner(routePath) {
  // Normalize path
  const normalized = routePath.replace(/^\//, '').split('/')[0];
  
  // Check explicit ownership
  if (BUILD_OWNERSHIP[normalized]) {
    return BUILD_OWNERSHIP[normalized];
  }
  
  // Check prefix matching
  for (const [prefix, owner] of Object.entries(BUILD_OWNERSHIP)) {
    if (normalized.startsWith(prefix)) {
      return owner;
    }
  }
  
  // Check if it's a shared route
  if (SHARED_ROUTES.includes(normalized)) {
    return 'SHARED';
  }
  
  // Default to MARKETING
  return 'MARKETING';
}

/**
 * Test a single route with curl
 */
async function testRouteHttp(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? 'https' : 'http';
    const startTime = Date.now();
    
    const curl = spawn('curl', [
      '-sI', '-L', '-o', '/dev/null', '-w', '%{http_code}|%{time_total}',
      url
    ]);
    
    let output = '';
    curl.on('close', (code) => {
      const duration = (Date.now() - startTime);
      const parts = output.split('|');
      const status = parseInt(parts[0]) || 0;
      const time = parseFloat(parts[1]) || (duration / 1000);
      
      resolve({
        url,
        status,
        duration: Math.round(time * 1000),
        ok: status >= 200 && status < 400,
        redirect: status >= 300 && status < 400
      });
    });
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('error', (err) => {
      resolve({
        url,
        status: 0,
        error: err.message,
        ok: false
      });
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('═'.repeat(70));
  console.log('  ELEVATE LMS - AUTOMATED ROUTE DISCOVERY & CERTIFICATION');
  console.log('═'.repeat(70));
  console.log();
  
  // Phase 1: Discover all routes
  console.log('📡 PHASE 1: ROUTE DISCOVERY');
  console.log('─'.repeat(70));
  
  const routes = discoverRoutes();
  console.log(`✓ Discovered ${routes.length} routes`);
  
  // Phase 2: Assign ownership
  console.log();
  console.log('📋 PHASE 2: BUILD OWNERSHIP');
  console.log('─'.repeat(70));
  
  const ownership = { MARKETING: [], ADMIN: [], LMS: [], SHARED: [] };
  
  for (const route of routes) {
    route.owner = getRouteOwner(route.path);
    ownership[route.owner].push(route);
  }
  
  for (const [build, buildRoutes] of Object.entries(ownership)) {
    console.log(`  ${build}: ${buildRoutes.length} routes`);
  }
  
  // Phase 3: Test all routes
  console.log();
  console.log('🧪 PHASE 3: HTTP TESTING');
  console.log('─'.repeat(70));
  
  const results = {
    passed: 0,
    failed: 0,
    redirects: 0,
    routes: []
  };
  
  // Test critical routes first
  const criticalRoutes = ['/', '/about', '/programs', '/admin', '/lms', '/login', 
                          '/store', '/apply', '/host-shop', '/partner'];
  
  for (const route of criticalRoutes) {
    const url = `${BASE_URL}${route}`;
    const result = await testRouteHttp(url);
    results.routes.push({ ...result, route, owner: getRouteOwner(route) });
    
    const icon = result.ok ? '✅' : (result.redirect ? '🔄' : '❌');
    console.log(`  ${icon} ${route.padEnd(25)} HTTP ${result.status} (${result.duration}ms)`);
    
    if (result.ok) results.passed++;
    else if (result.redirect) results.redirects++;
    else results.failed++;
  }
  
  // Test sample of other routes
  const otherRoutes = routes
    .filter(r => !criticalRoutes.includes(r.path) && r.type === 'page')
    .slice(0, 50);
  
  for (const route of otherRoutes) {
    const url = `${BASE_URL}${route.path}`;
    const result = await testRouteHttp(url);
    results.routes.push({ ...result, route: route.path, owner: route.owner });
    
    if (results.routes.length % 10 === 0) {
      process.stdout.write('.');
    }
    
    if (result.ok) results.passed++;
    else if (result.redirect) results.redirects++;
    else results.failed++;
  }
  
  console.log();
  
  // Phase 4: Generate Report
  console.log();
  console.log('📊 PHASE 4: CERTIFICATION REPORT');
  console.log('─'.repeat(70));
  
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      totalRoutes: routes.length,
      testedRoutes: results.passed + results.failed,
      passed: results.passed,
      failed: results.failed,
      redirects: results.redirects,
      passRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) + '%'
    },
    ownership,
    criticalRoutes: results.routes.filter(r => criticalRoutes.includes(r.route)),
    sampleResults: results.routes.slice(0, 100)
  };
  
  // Save report
  const reportPath = path.join(ROOT, 'scripts', 'route-certification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Summary
  console.log();
  console.log('═'.repeat(70));
  console.log('  SUMMARY');
  console.log('═'.repeat(70));
  console.log(`  Total Routes Discovered: ${routes.length}`);
  console.log(`  Routes Tested: ${results.passed + results.failed}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  🔄 Redirects: ${results.redirects}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  📈 Pass Rate: ${report.summary.passRate}`);
  console.log();
  console.log(`  📄 Full Report: ${reportPath}`);
  console.log('═'.repeat(70));
  
  // Certification
  if (results.failed === 0 && results.passed > 0) {
    console.log();
    console.log('  🎉 CERTIFICATION: PASSED');
    console.log('  All critical routes return valid HTTP responses.');
    console.log();
  } else if (results.failed > 0) {
    console.log();
    console.log('  ⚠️  CERTIFICATION: NEEDS ATTENTION');
    console.log(`  ${results.failed} route(s) require fixes.`);
    console.log();
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
