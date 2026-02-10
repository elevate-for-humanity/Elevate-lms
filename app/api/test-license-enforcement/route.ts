import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import {
  getLicense,
  isFeatureEnabled,
  checkUsageLimits,
} from '@/lib/license-guard';

/**
 * Test License Enforcement
 * GET /api/test-license-enforcement
 */
export async function GET() {
  // Block in production — this endpoint is for development/testing only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 1: Get license for tenant 1
    const license1 = await getLicense('test-tenant-1');
    results.tests.push({
      name: 'Get License for Tenant 1',
      passed: license1 !== null && license1.plan === 'professional',
      data: license1,
    });

    // Test 2: Get license for tenant 2
    const license2 = await getLicense('test-tenant-2');
    results.tests.push({
      name: 'Get License for Tenant 2',
      passed: license2 !== null && license2.plan === 'enterprise',
      data: license2,
    });

    // Test 3: Feature gating - AI features (both should have)
    const aiEnabled1 = await isFeatureEnabled('test-tenant-1', 'ai_features');
    results.tests.push({
      name: 'Tenant 1 - AI Features Enabled',
      passed: aiEnabled1 === true,
      data: { enabled: aiEnabled1 },
    });

    const aiEnabled2 = await isFeatureEnabled('test-tenant-2', 'ai_features');
    results.tests.push({
      name: 'Tenant 2 - AI Features Enabled',
      passed: aiEnabled2 === true,
      data: { enabled: aiEnabled2 },
    });

    // Test 4: Feature gating - White label (only enterprise)
    const whiteLabelEnabled1 = await isFeatureEnabled(
      'test-tenant-1',
      'white_label'
    );
    results.tests.push({
      name: 'Tenant 1 - White Label Disabled (Professional)',
      passed: whiteLabelEnabled1 === false,
      data: { enabled: whiteLabelEnabled1 },
    });

    const whiteLabelEnabled2 = await isFeatureEnabled(
      'test-tenant-2',
      'white_label'
    );
    results.tests.push({
      name: 'Tenant 2 - White Label Enabled (Enterprise)',
      passed: whiteLabelEnabled2 === true,
      data: { enabled: whiteLabelEnabled2 },
    });

    // Test 5: Feature gating - SSO (only enterprise)
    const ssoEnabled1 = await isFeatureEnabled('test-tenant-1', 'sso');
    results.tests.push({
      name: 'Tenant 1 - SSO Disabled (Professional)',
      passed: ssoEnabled1 === false,
      data: { enabled: ssoEnabled1 },
    });

    const ssoEnabled2 = await isFeatureEnabled('test-tenant-2', 'sso');
    results.tests.push({
      name: 'Tenant 2 - SSO Enabled (Enterprise)',
      passed: ssoEnabled2 === true,
      data: { enabled: ssoEnabled2 },
    });

    // Test 6: Usage limits
    const limits1 = await checkUsageLimits('test-tenant-1');
    results.tests.push({
      name: 'Tenant 1 - Usage Limits Check',
      passed: limits1.users.max === 50 && limits1.programs.max === 10,
      data: limits1,
    });

    const limits2 = await checkUsageLimits('test-tenant-2');
    results.tests.push({
      name: 'Tenant 2 - Usage Limits Check (Unlimited)',
      passed: limits2.users.max === null && limits2.programs.max === null,
      data: limits2,
    });

    // Test 7: Invalid tenant
    const invalidLicense = await getLicense('non-existent-tenant');
    results.tests.push({
      name: 'Invalid Tenant Returns Null',
      passed: invalidLicense === null,
      data: { license: invalidLicense },
    });

    // Calculate summary
    const totalTests = results.tests.length;
    const passedTests = results.tests.filter((t: any) => t.passed).length;
    const failedTests = totalTests - passedTests;

    results.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      success_rate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
      all_passed: failedTests === 0,
    };

    results.enforcement_working = failedTests === 0;

    return NextResponse.json(results);
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
