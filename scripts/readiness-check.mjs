// scripts/readiness-check.mjs
// Autopilot: hit production as a fake student/partner and look for bad signals


const BASE_URL =
  process.env.READINESS_BASE_URL || 'https://elevateconnectsdirectory.org';

// Critical routes that must work for students and partners
const routes = [
  { path: '/', label: 'Homepage', critical: true },
  { path: '/programs', label: 'Programs List', critical: true },
  { path: '/programs/hvac', label: 'HVAC Program', critical: true },
  { path: '/programs/barber', label: 'Barber Program', critical: true },
  { path: '/programs/cna', label: 'CNA Program', critical: true },
  { path: '/programs/cdl', label: 'CDL Program', critical: true },
  {
    path: '/programs/medical-assistant',
    label: 'Medical Assistant Program',
    critical: true,
  },
  { path: '/programs/nail-tech', label: 'Nail Tech Program', critical: true },
  { path: '/about', label: 'About Page', critical: false },
  { path: '/contact', label: 'Contact Page', critical: false },
  {
    path: '/lms/dashboard',
    label: 'Student Dashboard (may redirect)',
    critical: false,
  },
  { path: '/partners/apply', label: 'Partner Application', critical: true },
  { path: '/api/health', label: 'API Health Check', critical: true },
];

// Patterns that indicate the page is broken or unfinished
const BAD_PATTERNS = [
  { pattern: 'Internal Server Error', severity: 'critical' },
  { pattern: 'Application error', severity: 'critical' },
  { pattern: 'TypeError:', severity: 'critical' },
  { pattern: 'ReferenceError', severity: 'critical' },
  { pattern: 'supabaseUrl is required', severity: 'critical' },
  { pattern: 'Skeleton', severity: 'warning' },
  { pattern: 'Loading...', severity: 'warning' },
  { pattern: 'Coming soon', severity: 'warning' },
  { pattern: 'TODO', severity: 'info' },
  { pattern: 'placeholder', severity: 'info' },
  { pattern: 'mock data', severity: 'info' },
];

async function checkRoute(route) {
  const url = `${BASE_URL}${route.path}`;

  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Elevate-Autopilot-Readiness-Check/1.0',
      },
    });


    // Check status code
    if (res.status >= 500) {
      throw new Error(`Server error: status ${res.status}`);
    }

    // For API health check, expect JSON
    if (route.path === '/api/health') {
      const json = await res.json();
      if (!json.status || json.status !== 'ok') {
        throw new Error(`API health check failed: ${JSON.stringify(json)}`);
      }
      return { route, ok: true, status: res.status };
    }

    // Accept 200, 301, 302, 307, 308 as "ok-ish"
    if (res.status >= 400 && res.status < 500) {
      // 404 might be expected for some routes during development
      if (res.status === 404 && !route.critical) {
        return { route, ok: true, status: res.status, warning: '404' };
      }
      throw new Error(`Client error: status ${res.status}`);
    }

    // For redirects, just note them
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      return { route, ok: true, status: res.status, redirect: location };
    }

    // Check content for bad patterns
    const text = await res.text();
    const foundIssues = [];

    for (const { pattern, severity } of BAD_PATTERNS) {
      if (text.includes(pattern)) {
        foundIssues.push({ pattern, severity });
      }
    }

    // Critical issues fail the check
    const criticalIssues = foundIssues.filter((i) => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      const patterns = criticalIssues.map((i) => i.pattern).join(', ');
      throw new Error(`Page contains critical error pattern(s): ${patterns}`);
    }

    // Warning issues are noted but don't fail
    const warnings = foundIssues.filter((i) => i.severity === 'warning');
    if (warnings.length > 0) {
        `   ⚠️  Found warning pattern(s): ${warnings
          .map((w) => w.pattern)
          .join(', ')}`
      );
    }

    // Info issues are just logged
    const infos = foundIssues.filter((i) => i.severity === 'info');
    if (infos.length > 0) {
        `   ℹ️  Found info pattern(s): ${infos.map((i) => i.pattern).join(', ')}`
      );
    }

    return {
      route,
      ok: true,
      status: res.status,
      warnings: warnings.map((w) => w.pattern),
      infos: infos.map((i) => i.pattern),
    };
  } catch (err) {
    console.error(`   ❌ FAILED: ${err.message}`);
    return { route, ok: false, error: err.message };
  }
}

async function main() {

  const results = [];
  for (const route of routes) {
    const result = await checkRoute(route);
    results.push(result);

    // Small delay to avoid hammering the server
    await new Promise((resolve) => setTimeout(resolve, 500));
  }


  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const warnings = results.filter((r) => r.warnings && r.warnings.length > 0);



  for (const result of results) {
    const icon = result.ok ? '✅' : '❌';
    const status = result.status ? `[${result.status}]` : '';
      `${icon} ${result.route.label} ${status} (${result.route.path})`
    );

    if (result.error) {
    }

    if (result.redirect) {
    }

    if (result.warnings && result.warnings.length > 0) {
    }

    if (result.warning) {
    }
  }


  if (failed.length > 0) {
    console.error(
      `\n❌ READINESS CHECK FAILED – ${failed.length} route(s) have critical issues`
    );
    console.error('\nFailed routes:');
    for (const result of failed) {
      console.error(`  - ${result.route.label}: ${result.error}`);
    }
    console.error('\nRecommended actions:');
    console.error('  1. Run: Northflank env sync');
    console.error('  2. Check Northflank build logs');
    console.error('  3. Verify Supabase environment variables');
    console.error('  4. Test failed routes manually');
    process.exit(1);
  }

  if (warnings.length > 0) {
      `\n⚠️  ${warnings.length} route(s) have warnings (non-critical)`
    );
  }

}

main().catch((err) => {
  console.error('\n💥 Unexpected error in readiness check:', err);
  process.exit(1);
});
