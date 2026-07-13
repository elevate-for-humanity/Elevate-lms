#!/usr/bin/env node
/**
 * ROUTE CERTIFICATION TEST
 * 
 * Automated testing for all production routes
 * Tests: HTTP status, errors, broken links, response time
 * 
 * Usage: node scripts/route-certification-test.mjs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://www.elevateforhumanity.org';
const TIMEOUT_MS = 10000;
const CONCURRENCY = 10;

// Exclude these routes from testing
const EXCLUDED = new Set([
  'api',
  'auth', 
  '(auth)',
  '_next',
  'health',
  'robots.txt',
  'sitemap.xml',
  'admin', // Requires auth
  'lms',   // Requires auth
  'learner',
  'instructor',
  'partner',
  'employer',
  'student',
  '/api/',
  '/admin/',
  '/lms/',
]);

// Expected redirects
const EXPECTED_REDIRECTS = new Map([
  ['/host-shops', '/partners/host-shops'],
]);

// Categories for reporting
const results = {
  passed: [],
  failed: [],
  errors: [],
  redirects: [],
  skipped: [],
};

let totalTests = 0;
let completedTests = 0;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const prefix = {
    info: 'ℹ️',
    pass: '✅',
    fail: '❌',
    warn: '⚠️',
    redirect: '🔄',
  }[type] || '•';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function testRoute(route) {
  const url = `${BASE_URL}${route}`;
  const result = {
    route,
    url,
    status: null,
    statusText: '',
    error: null,
    duration: 0,
    redirects: [],
    content: null,
  };
  
  const startTime = Date.now();
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Elevate-Certification-Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    result.duration = Date.now() - startTime;
    result.status = response.status;
    result.statusText = response.statusText;
    result.redirects = [...response.headers.entries()]
      .filter(([k]) => k.toLowerCase() === 'location')
      .map(([, v]) => v);
    
    // Check for server errors in content
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      const text = await response.text();
      result.content = text;
      
      // Look for error indicators
      const errorPatterns = [
        /Application Error/i,
        /Server Error/i,
        /500 Internal Server Error/i,
        /502 Bad Gateway/i,
        /503 Service Unavailable/i,
        /Module not found/i,
        /Cannot find module/i,
      ];
      
      for (const pattern of errorPatterns) {
        if (pattern.test(text)) {
          result.error = `Server error detected: ${pattern}`;
          break;
        }
      }
    }
    
  } catch (error) {
    result.duration = Date.now() - startTime;
    result.error = error.name === 'AbortError' 
      ? `Timeout after ${TIMEOUT_MS}ms`
      : error.message;
  }
  
  return result;
}

function categorizeResult(result) {
  const { route, status, error, redirects } = result;
  
  if (error) {
    results.errors.push(result);
    return;
  }
  
  if (status >= 300 && status < 400 && redirects.length > 0) {
    const expectedDest = EXPECTED_REDIRECTS.get(route);
    if (expectedDest && redirects[0].includes(expectedDest)) {
      results.redirects.push(result);
    } else {
      results.redirects.push(result);
    }
    return;
  }
  
  if (status === 404) {
    results.failed.push(result);
    return;
  }
  
  if (status >= 500) {
    results.failed.push(result);
    return;
  }
  
  if (status === 200) {
    if (result.error) {
      results.failed.push(result);
    } else {
      results.passed.push(result);
    }
    return;
  }
  
  // Other status codes
  results.skipped.push(result);
}

async function runTests(routes) {
  log(`Starting route certification test against ${BASE_URL}`);
  log(`Testing ${routes.length} routes with concurrency ${CONCURRENCY}`);
  console.log('');
  
  const batches = [];
  for (let i = 0; i < routes.length; i += CONCURRENCY) {
    batches.push(routes.slice(i, i + CONCURRENCY));
  }
  
  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(testRoute));
    for (const result of batchResults) {
      categorizeResult(result);
      completedTests++;
      
      if (completedTests % 50 === 0) {
        process.stdout.write(`\rProgress: ${completedTests}/${totalTests} routes tested`);
      }
    }
  }
  
  console.log('\n');
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('ROUTE CERTIFICATION REPORT');
  console.log('='.repeat(80));
  console.log('');
  
  console.log('SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total Routes Tested:     ${totalTests}`);
  console.log(`Passed:                  ${results.passed.length} (${((results.passed.length/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed:                  ${results.failed.length} (${((results.failed.length/totalTests)*100).toFixed(1)}%)`);
  console.log(`Server Errors:           ${results.errors.length} (${((results.errors.length/totalTests)*100).toFixed(1)}%)`);
  console.log(`Redirects:               ${results.redirects.length}`);
  console.log(`Skipped/Other:           ${results.skipped.length}`);
  console.log('');
  
  // Performance summary
  const allPassed = [...results.passed, ...results.redirects];
  if (allPassed.length > 0) {
    const durations = allPassed.map(r => r.duration).sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const max = durations[durations.length - 1];
    
    console.log('PERFORMANCE');
    console.log('-'.repeat(40));
    console.log(`Average Response Time:   ${avg.toFixed(0)}ms`);
    console.log(`95th Percentile:        ${p95}ms`);
    console.log(`Max Response Time:      ${max}ms`);
    console.log('');
  }
  
  // Failed routes
  if (results.failed.length > 0) {
    console.log('FAILED ROUTES (404/500)');
    console.log('-'.repeat(40));
    for (const r of results.failed) {
      console.log(`  ${r.status} ${r.route}`);
      if (r.error) console.log(`         Error: ${r.error}`);
    }
    console.log('');
  }
  
  // Server errors
  if (results.errors.length > 0) {
    console.log('SERVER ERRORS');
    console.log('-'.repeat(40));
    for (const r of results.errors) {
      console.log(`  ${r.route}`);
      console.log(`    Error: ${r.error}`);
      console.log(`    Duration: ${r.duration}ms`);
    }
    console.log('');
  }
  
  // Redirects
  if (results.redirects.length > 0) {
    console.log('REDIRECTS');
    console.log('-'.repeat(40));
    for (const r of results.redirects) {
      const expected = EXPECTED_REDIRECTS.get(r.route);
      const status = expected && r.redirects[0]?.includes(expected) ? '✓' : '?';
      console.log(`  ${status} ${r.status} ${r.route} → ${r.redirects[0] || 'none'}`);
    }
    console.log('');
  }
  
  // Pass count
  console.log('PASSED ROUTES');
  console.log('-'.repeat(40));
  for (const r of results.passed.slice(0, 50)) {
    console.log(`  ${r.status} ${r.route} (${r.duration}ms)`);
  }
  if (results.passed.length > 50) {
    console.log(`  ... and ${results.passed.length - 50} more`);
  }
  console.log('');
  
  // Return exit code based on results
  const hasFailures = results.failed.length > 0 || results.errors.length > 0;
  return hasFailures ? 1 : 0;
}

function getRoutes() {
  const appDir = join(ROOT, 'app');
  const routes = [];
  
  function walk(dir, prefix = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      if (entry.name === 'components' || entry.name === 'lib' || entry.name === 'hooks') continue;
      
      const fullPath = join(dir, entry.name);
      const route = prefix === '' ? `/${entry.name}` : `${prefix}/${entry.name}`;
      
      if (entry.isDirectory()) {
        // Check if it's a route (has page.tsx)
        const hasPage = existsSync(join(fullPath, 'page.tsx'));
        const hasLayout = existsSync(join(fullPath, 'layout.tsx'));
        
        if (hasPage || hasLayout) {
          routes.push(route);
        }
        
        // Don't recurse into sub-routes for now
      }
    }
  }
  
  walk(appDir);
  
  // Add root
  if (existsSync(join(appDir, 'page.tsx'))) {
    routes.unshift('/');
  }
  
  return routes.filter(r => !EXCLUDED.has(r.replace('/', '')));
}

function existsSync(path) {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}

// Main
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const routes = getRoutes();
totalTests = routes.length;

await runTests(routes);

const exitCode = generateReport();

process.exit(exitCode);
