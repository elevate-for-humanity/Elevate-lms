#!/usr/bin/env npx tsx
/**
 * Portal Health Monitor - Checks all portal endpoints
 * Usage: npx tsx scripts/portal-health-monitor.ts
 */

const BASE_URLS = [
  'https://www.elevateforhumanity.org',
  '',
];

const PUBLIC_ROUTES = [
  '/',
  '/programs',
  '/apply',
  '/login',
  '/signup',
  '/about',
  '/contact',
  '/funding',
  '/wioa-eligibility',
  '/apprenticeships',
];

const PORTAL_ROUTES = [
  '/learner/dashboard',
  '/portal/apprentice',
  '/employer/dashboard',
  '/partner/dashboard',
  '/program-holder/dashboard',
  '/case-manager/dashboard',
  '/support',
];

const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/students',
  '/admin/enrollments',
  '/admin/applications',
  '/admin/programs',
  '/admin/staff-portal/dashboard',
  '/admin/staff-portal/students',
  '/admin/staff-portal/attendance',
  '/admin/instructor/dashboard',
  '/admin/barber-shop-applications',
  '/admin/billing',
];

const API_ROUTES = [
  '/api/health',
  '/api/programs',
];

interface HealthResult {
  url: string;
  status: number;
  ok: boolean;
  responseTime: number;
  error?: string;
}

async function checkUrl(url: string): Promise<HealthResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Elevate-Health-Monitor/1.0',
      },
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - start;
    
    return {
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - start;
    return {
      url,
      status: 0,
      ok: false,
      responseTime,
      error: error.message || 'Unknown error',
    };
  }
}

async function runHealthCheck() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  ELEVATE PORTAL HEALTH MONITOR');
  console.log('  ' + new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const allRoutes = [
    ...PUBLIC_ROUTES.map(r => ({ base: BASE_URLS[0], route: r })),
    ...PORTAL_ROUTES.map(r => ({ base: BASE_URLS[0], route: r })),
    ...ADMIN_ROUTES.map(r => ({ base: BASE_URLS[1], route: r })),
    ...API_ROUTES.map(r => ({ base: BASE_URLS[0], route: r })),
  ];

  console.log(`Checking ${allRoutes.length} endpoints...\n`);

  const results: HealthResult[] = [];
  
  // Check in parallel batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < allRoutes.length; i += BATCH_SIZE) {
    const batch = allRoutes.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(({ base, route }) => 
      checkUrl(base + route).then(r => ({ ...r, url: base + route }))
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Summary by category
  const categories = [
    { name: 'PUBLIC PAGES', routes: PUBLIC_ROUTES, base: BASE_URLS[0] },
    { name: 'STUDENT PORTALS', routes: PORTAL_ROUTES, base: BASE_URLS[0] },
    { name: 'ADMIN PORTAL', routes: ADMIN_ROUTES, base: BASE_URLS[1] },
    { name: 'API ENDPOINTS', routes: API_ROUTES, base: BASE_URLS[0] },
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  let totalRoutes = 0;

  for (const cat of categories) {
    const catResults = results.filter(r => r.url.startsWith(cat.base));
    console.log(`\n📋 ${cat.name}`);
    console.log('─'.repeat(70));
    
    let passed = 0;
    let failed = 0;
    
    for (const route of cat.routes) {
      const result = results.find(r => r.url === cat.base + route);
      if (result) {
        const icon = result.ok ? '✅' : '❌';
        const statusText = result.status > 0 ? `${result.status}` : 'ERR';
        const timeText = `${result.responseTime}ms`;
        console.log(`  ${icon} ${route.padEnd(40)} ${statusText.padStart(5)} ${timeText}`);
        
        if (result.ok) passed++;
        else failed++;
      }
    }
    
    totalPassed += passed;
    totalFailed += failed;
    totalRoutes += cat.routes.length;
    
    const pct = Math.round((passed / cat.routes.length) * 100);
    console.log(`\n  Summary: ${passed}/${cat.routes.length} passed (${pct}%)`);
  }

  // Overall summary
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  OVERALL SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`  Total:  ${totalRoutes}`);
  console.log(`  Passed: ${totalPassed} ✅`);
  console.log(`  Failed: ${totalFailed} ❌`);
  console.log(`  Score:  ${Math.round((totalPassed / totalRoutes) * 100)}%`);
  
  if (totalFailed > 0) {
    console.log('\n  Failed Endpoints:');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`    - ${r.url}: ${r.error || `HTTP ${r.status}`}`);
    });
  }
  
  // Health API details
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  HEALTH API DETAILS');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  const healthResult = results.find(r => r.url.includes('/api/health'));
  if (healthResult && healthResult.ok) {
    try {
      const response = await fetch(healthResult.url);
      const health = await response.json();
      console.log(`  Status:     ${health.status}`);
      console.log(`  Version:    ${health.version}`);
      console.log(`  Production: ${health.production_ready ? '✅ Ready' : '⚠️ Not Ready'}`);
      
      if (health.checks) {
        console.log('\n  Checks:');
        Object.entries(health.checks).forEach(([key, check]: [string, any]) => {
          const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
          console.log(`    ${icon} ${key}: ${check.status}`);
          if (check.error) console.log(`       Error: ${check.error}`);
        });
      }
    } catch (e) {
      console.log(`  Error fetching health details: ${e}`);
    }
  } else {
    console.log(`  Health API: ${healthResult?.error || `HTTP ${healthResult?.status}`}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');
  
  return totalFailed === 0;
}

runHealthCheck()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Health check failed:', err);
    process.exit(1);
  });