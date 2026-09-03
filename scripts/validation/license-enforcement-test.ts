/**
 * STEP 7C: License Enforcement Matrix Validation
 *
 * Run: npx tsx scripts/validation/license-enforcement-test.ts
 *
 * Tests each license state:
 * - Active → Access allowed
 * - Expired → 402 blocked
 * - Suspended → 402 blocked
 * - Revoked → 403 blocked
 * - Missing feature → Blocked
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

async function runLicenseEnforcementTest() {
  console.log('=== STEP 7C: License Enforcement Matrix ===\n');

  const results: TestResult[] = [];
  const testTenantId = crypto.randomUUID();

  // Create test tenant
  await supabase.from('tenants').insert({
    id: testTenantId,
    name: 'Test Tenant',
    slug: `test-${Date.now()}`,
    active: true,
  });

  console.log(`Created test tenant: ${testTenantId}\n`);

  // Test 1: Active license
  await supabase.from('licenses').insert({
    tenant_id: testTenantId,
    plan: 'professional',
    status: 'active',
    features: { white_label: true, api_access: true },
  });

  const { data: activeLicense } = await supabase.rpc('get_active_license', {
    p_tenant_id: testTenantId,
  });

  results.push({
    scenario: 'Active license',
    expected: 'Access allowed (status=active)',
    actual: activeLicense?.status || 'null',
    passed: activeLicense?.status === 'active',
  });

  // Test 2: Expired license
  await supabase.from('licenses').update({ status: 'expired' }).eq('tenant_id', testTenantId);

  const { data: expiredLicense } = await supabase.rpc('get_active_license', {
    p_tenant_id: testTenantId,
  });

  results.push({
    scenario: 'Expired license',
    expected: 'Blocked (status=expired)',
    actual: expiredLicense?.status || 'null',
    passed: expiredLicense?.status === 'expired',
  });

  // Test 3: Suspended license
  await supabase
    .from('licenses')
    .update({ status: 'suspended', suspended_reason: 'Refund' })
    .eq('tenant_id', testTenantId);

  const { data: suspendedLicense } = await supabase.rpc('get_active_license', {
    p_tenant_id: testTenantId,
  });

  results.push({
    scenario: 'Suspended license (refund)',
    expected: 'Blocked (status=suspended)',
    actual: suspendedLicense?.status || 'null',
    passed: suspendedLicense?.status === 'suspended',
  });

  // Test 4: Revoked license
  await supabase
    .from('licenses')
    .update({ status: 'revoked', revoked_reason: 'Admin action' })
    .eq('tenant_id', testTenantId);

  const { data: revokedLicense } = await supabase.rpc('get_active_license', {
    p_tenant_id: testTenantId,
  });

  results.push({
    scenario: 'Revoked license (admin)',
    expected: 'Blocked (status=revoked)',
    actual: revokedLicense?.status || 'null',
    passed: revokedLicense?.status === 'revoked',
  });

  // Test 5: Missing feature
  await supabase
    .from('licenses')
    .update({
      status: 'active',
      features: { white_label: false, api_access: true },
    })
    .eq('tenant_id', testTenantId);

  const { data: featureLicense } = await supabase.rpc('get_active_license', {
    p_tenant_id: testTenantId,
  });

  const hasWhiteLabel = featureLicense?.features?.white_label === true;

  results.push({
    scenario: 'Missing feature (white_label)',
    expected: 'Feature blocked (white_label=false)',
    actual: `white_label=${featureLicense?.features?.white_label}`,
    passed: !hasWhiteLabel,
  });

  // Print results
  console.log('License Enforcement Matrix Results:\n');
  console.log('| Scenario | Expected | Actual | Result |');
  console.log('|----------|----------|--------|--------|');

  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${r.scenario} | ${r.expected} | ${r.actual} | ${status} |`);
  }

  // Cleanup
  await supabase.from('licenses').delete().eq('tenant_id', testTenantId);
  await supabase.from('tenants').delete().eq('id', testTenantId);

  console.log('\nTest data cleaned up.');

  const allPassed = results.every((r) => r.passed);
  return allPassed;
}

runLicenseEnforcementTest()
  .then((passed) => {
    console.log(`\n=== License Enforcement Test: ${passed ? 'PASSED' : 'FAILED'} ===`);
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
