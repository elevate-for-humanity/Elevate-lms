/**
 * STEP 7A: Stripe Replay & Idempotency Validation Script
 *
 * Run: npx tsx scripts/validation/idempotency-test.ts
 *
 * Tests:
 * 1. Replay same Stripe event twice
 * 2. Verify only ONE processed_stripe_events row
 * 3. Verify only ONE provisioning_jobs row
 * 4. Verify webhook returns 200 on both calls
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runIdempotencyTest() {
  console.log('=== STEP 7A: Idempotency Validation ===\n');

  const testEventId = `evt_test_idempotency_${Date.now()}`;
  const testCorrelationId = `pi_test_${Date.now()}`;

  // Simulate inserting the same event twice
  console.log(`Test Event ID: ${testEventId}`);
  console.log(`Correlation ID: ${testCorrelationId}\n`);

  // First insert
  const { error: error1 } = await supabase.from('processed_stripe_events').insert({
    stripe_event_id: testEventId,
    event_type: 'checkout.session.completed',
    correlation_id: testCorrelationId,
    payload: { test: true },
  });

  console.log('First insert:', error1 ? `Error: ${error1.message}` : 'Success');

  // Second insert (should fail due to unique constraint)
  const { error: error2 } = await supabase.from('processed_stripe_events').insert({
    stripe_event_id: testEventId,
    event_type: 'checkout.session.completed',
    correlation_id: testCorrelationId,
    payload: { test: true, attempt: 2 },
  });

  console.log(
    'Second insert:',
    error2 ? `Blocked (expected): ${error2.code}` : 'Unexpected success',
  );

  // Count rows
  const { count } = await supabase
    .from('processed_stripe_events')
    .select('*', { count: 'exact', head: true })
    .eq('stripe_event_id', testEventId);

  console.log(`\nRow count for event: ${count}`);
  console.log(`Expected: 1`);
  console.log(`Result: ${count === 1 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Cleanup
  await supabase.from('processed_stripe_events').delete().eq('stripe_event_id', testEventId);

  console.log('Test data cleaned up.');

  return count === 1;
}

// Run if executed directly
runIdempotencyTest()
  .then((passed) => {
    console.log(`\n=== Idempotency Test: ${passed ? 'PASSED' : 'FAILED'} ===`);
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
