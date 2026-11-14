#!/usr/bin/env node

/**
 * Dashboard Test Script
 * Tests all dashboard routes for accessibility and functionality
 */

import { createClient } from '@supabase/supabase-js';

// Check environment
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

const missingVars = requiredVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((v) => console.error(`   - ${v}`));
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dashboard routes to test
const dashboards = [
  {
    name: 'Student Dashboard',
    path: '/student/dashboard',
    role: 'student',
    features: [
      'Active enrollments',
      'Progress tracking',
      'AI instructor card',
      'Course access',
      'Certificates',
    ],
  },
  {
    name: 'Admin Dashboard',
    path: '/admin/dashboard',
    role: 'admin',
    features: ['User management', 'Enrollment overview', 'Analytics', 'System health'],
  },
  {
    name: 'Program Holder Dashboard',
    path: '/program-holder/dashboard',
    role: 'program_holder',
    features: ['Apprentice list', 'Progress tracking', 'Hour logging', 'MOU management'],
  },
  {
    name: 'Instructor Dashboard',
    path: '/instructor/dashboard',
    role: 'instructor',
    features: ['Student list', 'Grade management', 'Course materials'],
  },
  {
    name: 'Employer Dashboard',
    path: '/employer/dashboard',
    role: 'employer',
    features: ['Employee training', 'Progress reports', 'Compliance tracking'],
  },
  {
    name: 'Partner Dashboard',
    path: '/partner/dashboard',
    role: 'partner',
    features: ['Course catalog', 'Enrollment tracking', 'Revenue reports'],
  },
];

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
};

async function testDashboardRoute(dashboard) {
  const result = {
    name: dashboard.name,
    path: dashboard.path,
    accessible: false,
    authenticated: false,
    features: [],
    errors: [],
    warnings: [],
  };

  try {
    // Test 1: Route accessibility

    const response = await fetch(`${siteUrl}${dashboard.path}`, {
      method: 'GET',
      redirect: 'manual',
    });

    if (response.status === 200) {
      result.accessible = true;
    } else if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location');
      if (location?.includes('/login')) {
        result.authenticated = true;
      } else {
        result.warnings.push(`Unexpected redirect to ${location}`);
      }
    } else if (response.status === 404) {
      result.errors.push('Route returns 404');
    } else {
      result.warnings.push(`Status ${response.status}`);
    }

    // Test 2: Check for required features (basic check)
    dashboard.features.forEach((feature) => {
      result.features.push({
        name: feature,
        status: 'not_tested',
      });
    });
  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

async function testDatabaseTables() {
  const tables = [
    'profiles',
    'enrollments',
    'programs',
    'ai_instructors',
    'ai_instructor_assignments',
    'program_holders',
  ];

  const tableResults = [];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);

      if (error) {
        tableResults.push({ table, status: 'error', error: error.message });
      } else {
        tableResults.push({ table, status: 'ok' });
      }
    } catch (error) {
      tableResults.push({ table, status: 'error', error: error.message });
    }
  }

  return tableResults;
}

async function testAuthenticationFlow() {
  const authTests = [];

  // Test 1: Login page accessible
  try {
    const response = await fetch(`${siteUrl}/login`);
    if (response.status === 200) {
      authTests.push({ test: 'login_page', status: 'pass' });
    } else {
      authTests.push({ test: 'login_page', status: 'fail' });
    }
  } catch (error) {
    authTests.push({ test: 'login_page', status: 'error' });
  }

  // Test 2: Protected routes redirect
  try {
    const response = await fetch(`${siteUrl}/student/dashboard`, {
      redirect: 'manual',
    });

    if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location');
      if (location?.includes('/login')) {
        authTests.push({ test: 'protected_redirect', status: 'pass' });
      } else {
        authTests.push({ test: 'protected_redirect', status: 'warning' });
      }
    } else {
      authTests.push({ test: 'protected_redirect', status: 'warning' });
    }
  } catch (error) {
    authTests.push({ test: 'protected_redirect', status: 'error' });
  }

  return authTests;
}

async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/health', method: 'GET', expectAuth: false },
    { path: '/api/dashboard/stats', method: 'GET', expectAuth: true },
    { path: '/api/ai/chat', method: 'POST', expectAuth: true },
  ];

  const apiResults = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${siteUrl}${endpoint.path}`, {
        method: endpoint.method,
      });

      if (endpoint.expectAuth && (response.status === 401 || response.status === 403)) {
        apiResults.push({ endpoint: endpoint.path, status: 'protected' });
      } else if (!endpoint.expectAuth && response.status === 200) {
        apiResults.push({ endpoint: endpoint.path, status: 'accessible' });
      } else if (response.status === 404) {
        apiResults.push({ endpoint: endpoint.path, status: 'not_found' });
      } else {
        apiResults.push({ endpoint: endpoint.path, status: response.status });
      }
    } catch (error) {
      apiResults.push({ endpoint: endpoint.path, status: 'error' });
    }
  }

  return apiResults;
}

async function runTests() {
  // Test all dashboards
  for (const dashboard of dashboards) {
    const result = await testDashboardRoute(dashboard);
    results.details.push(result);
    results.total++;

    if (result.errors.length === 0) {
      results.passed++;
    } else {
      results.failed++;
    }

    if (result.warnings.length > 0) {
      results.warnings++;
    }
  }

  // Test database
  const tableResults = await testDatabaseTables();

  // Test authentication
  const authResults = await testAuthenticationFlow();

  // Test API endpoints
  const apiResults = await testAPIEndpoints();

  // Summary

  const tablesOk = tableResults.filter((t) => t.status === 'ok').length;
  const tablesError = tableResults.filter((t) => t.status === 'error').length;

  const authPass = authResults.filter((t) => t.status === 'pass').length;
  const authFail = authResults.filter((t) => t.status === 'fail').length;

  const apiOk = apiResults.filter(
    (t) => t.status === 'protected' || t.status === 'accessible',
  ).length;

  // Detailed results

  results.details.forEach((result) => {
    const status = result.errors.length === 0 ? '✅' : '❌';

    if (result.errors.length > 0) {
      result.errors.forEach((err) => console.log(`     - ${err}`));
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warn) => console.log(`     - ${warn}`));
    }
  });

  // Recommendations

  if (results.failed > 0) {
  }

  if (tablesError > 0) {
  }

  const allPassed = results.failed === 0 && tablesError === 0;

  if (allPassed) {
  } else {
  }

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
