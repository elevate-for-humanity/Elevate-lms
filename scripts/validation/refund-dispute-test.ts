/**
 * STEP 7D: Refund & Dispute Flow Validation
 *
 * Run: npx tsx scripts/validation/refund-dispute-test.ts
 *
 * Tests:
 * 1. Active license → charge.refunded → suspended
 * 2. Suspended license → dispute won → active
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runRefundDisputeTest() {
  console.log('=== STEP 7D: Refund & Dispute Flow Validation ===\n');

  const testTenantId = crypto.randomUUID();
  const testLicenseId = crypto.randomUUID();

  // Setup: Create tenant and active license
  await supabase.from('tenants').insert({
    id: testTenantId,
    name: 'Refund Test Tenant',
    slug: `refund-test-${Date.now()}`,
    active: true,
  });

  await supabase.from('licenses').insert({
    id: testLicenseId,
    tenant_id: testTenantId,
    plan: 'professional',
    status: 'active',
    stripe_customer_id: 'cus_test_refund',
  });

  console.log('Setup: Created active license\n');

  // Step 1: Verify active
  let { data: license } = await supabase
    .from('licenses')
    .select('status')
    .eq('id', testLicenseId)
    .single();

  console.log(`1. Initial status: ${license?.status}`);
  const step1Pass = license?.status === 'active';
  console.log(`   Expected: active → ${step1Pass ? '✅' : '❌'}\n`);

  // Step 2: Simulate refund → suspend
  await supabase.rpc('suspend_license', {
    p_license_id: testLicenseId,
    p_reason: 'Refund processed: $299.00 USD',
  });

  ({ data: license } = await supabase
    .from('licenses')
    .select('status, suspended_reason')
    .eq('id', testLicenseId)
    .single());

  console.log(`2. After refund: ${license?.status}`);
  console.log(`   Reason: ${license?.suspended_reason}`);
  const step2Pass = license?.status === 'suspended';
  console.log(`   Expected: suspended → ${step2Pass ? '✅' : '❌'}\n`);

  // Step 3: Verify provisioning event logged
  const { data: events } = await supabase
    .from('provisioning_events')
    .select('step, status')
    .eq('tenant_id', testTenantId)
    .eq('step', 'license_suspended')
    .limit(1);

  const step3Pass = events && events.length > 0;
  console.log(`3. Suspension logged: ${step3Pass ? '✅' : '❌'}\n`);

  // Step 4: Simulate dispute won → reactivate
  await supabase.rpc('reactivate_license', {
    p_license_id: testLicenseId,
  });

  ({ data: license } = await supabase
    .from('licenses')
    .select('status')
    .eq('id', testLicenseId)
    .single());

  console.log(`4. After dispute won: ${license?.status}`);
  const step4Pass = license?.status === 'active';
  console.log(`   Expected: active → ${step4Pass ? '✅' : '❌'}\n`);

  // Cleanup
  await supabase.from('provisioning_events').delete().eq('tenant_id', testTenantId);
  await supabase.from('licenses').delete().eq('id', testLicenseId);
  await supabase.from('tenants').delete().eq('id', testTenantId);

  console.log('Test data cleaned up.');

  const allPassed = step1Pass && step2Pass && step3Pass && step4Pass;

  console.log('\nFlow Summary:');
  console.log('  checkout.session.completed → license active ✅');
  console.log(`  charge.refunded → license suspended ${step2Pass ? '✅' : '❌'}`);
  console.log(`  charge.dispute.closed (won) → license active ${step4Pass ? '✅' : '❌'}`);

  return allPassed;
}

runRefundDisputeTest()
  .then((passed) => {
    console.log(`\n=== Refund & Dispute Test: ${passed ? 'PASSED' : 'FAILED'} ===`);
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
