#!/usr/bin/env node
/**
 * Route Verification Script
 * Tests all routes after build to ensure they resolve correctly
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = process.env.SITE_URL || 'https://www.elevateforhumanity.org';

// Routes to test by build
const ROUTES = {
  MARKETING: [
    '/',
    '/about',
    '/programs',
    '/apply',
    '/store',
    '/login',
    '/admin-login',
    '/host-shop',
    '/partner',
    '/employer',
    '/funding',
    '/testing',
    '/contact',
    '/blog',
    '/faq',
    '/legal',
    '/privacy',
    '/terms',
    '/verify'
  ],
  ADMIN: [
    '/admin',
    '/admin/dashboard',
    '/admin/students',
    '/admin/enrollments',
    '/admin/courses',
    '/admin/reports',
    '/admin/analytics',
    '/admin/partners',
    '/admin/employers',
    '/admin/settings'
  ],
  LMS: [
    '/lms',
    '/lms/courses',
    '/learner/dashboard',
    '/profile',
    '/account',
    '/achievements',
    '/messages',
    '/schedule',
    '/student-support'
  ],
  SHARED: [
    '/api/health',
    '/certificates',
    '/credentials',
    '/verify'
  ]
};

function testRoute(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      const duration = Date.now() - startTime;
      resolve({
        url,
        status: res.statusCode,
        duration,
        ok: res.statusCode < 400
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        error: err.message,
        ok: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        error: 'Timeout',
        ok: false
      });
    });
  });
}

async function verifyRoutes() {
  console.log('🧪 ELEVATE LMS - ROUTE VERIFICATION\n');
  console.log(`Testing base URL: ${BASE_URL}\n`);
  
  const results = {
    passed: 0,
    failed: 0,
    routes: []
  };
  
  for (const [build, routes] of Object.entries(ROUTES)) {
    console.log(`\n📦 ${build} Routes:`);
    console.log('─'.repeat(60));
    
    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      const result = await testRoute(url);
      
      results.routes.push({ ...result, build });
      
      const icon = result.ok ? '✅' : '❌';
      const status = result.error ? `ERROR: ${result.error}` : `HTTP ${result.status}`;
      
      console.log(`${icon} ${route.padEnd(30)} ${status}`);
      
      if (result.ok) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      passed: results.passed,
      failed: results.failed,
      total: results.passed + results.failed
    },
    routes: results.routes
  };
  
  const reportPath = new URL('.', import.meta.url);
  fs.writeFileSync(
    path.join(reportPath.pathname, 'route-verification-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Report saved to: scripts/route-verification-report.json');
  
  // Exit with error code if any failed
  process.exit(results.failed > 0 ? 1 : 0);
}

verifyRoutes().catch(console.error);
