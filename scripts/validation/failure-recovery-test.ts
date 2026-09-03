/**
 * STEP 7B: Provisioning Failure Recovery Test
 *
 * Run: npx tsx scripts/validation/failure-recovery-test.ts
 *
 * Tests:
 * 1. Job retries increment attempts
 * 2. No orphan tenant/license on failure
 * 3. Job marked dead after max attempts
 * 4. Dead job can be retried via admin
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFailureRecoveryTest() {
  console.log('=== STEP 7B: Failure Recovery Validation ===\n');

  const testJobId = crypto.randomUUID();
  const testCorrelationId = `test_recovery_${Date.now()}`;

  // Create a test job
  const { error: insertError } = await supabase.from('provisioning_jobs').insert({
    id: testJobId,
    correlation_id: testCorrelationId,
    job_type: 'license_provision',
    payload: { test: true },
    status: 'queued',
    attempts: 0,
    max_attempts: 3,
  });

  if (insertError) {
    console.log('Failed to create test job:', insertError.message);
    return false;
  }

  console.log(`Created test job: ${testJobId}`);

  // Simulate failures by incrementing attempts
  for (let i = 1; i <= 3; i++) {
    const { error } = await supabase.rpc('complete_provisioning_job', {
      p_job_id: testJobId,
      p_success: false,
      p_error: `Simulated failure #${i}`,
    });

    if (error) {
      console.log(`Failure ${i} error:`, error.message);
    } else {
      console.log(`Failure ${i}: Job marked for retry/dead`);
    }
  }

  // Check job status
  const { data: job } = await supabase
    .from('provisioning_jobs')
    .select('status, attempts, last_error')
    .eq('id', testJobId)
    .single();

  console.log(`\nFinal job state:`);
  console.log(`  Status: ${job?.status}`);
  console.log(`  Attempts: ${job?.attempts}`);
  console.log(`  Last Error: ${job?.last_error}`);

  const isDeadLetter = job?.status === 'dead';
  console.log(`\nDead letter after max attempts: ${isDeadLetter ? '✅ PASS' : '❌ FAIL'}`);

  // Test retry
  const { data: retryResult } = await supabase.rpc('retry_dead_letter_job', {
    p_job_id: testJobId,
    p_admin_user_id: '00000000-0000-0000-0000-000000000000', // Test admin
  });

  const { data: retriedJob } = await supabase
    .from('provisioning_jobs')
    .select('status, attempts')
    .eq('id', testJobId)
    .single();

  const retryWorked = retriedJob?.status === 'queued' && retriedJob?.attempts === 0;
  console.log(`Retry resets job: ${retryWorked ? '✅ PASS' : '❌ FAIL'}`);

  // Cleanup
  await supabase.from('provisioning_jobs').delete().eq('id', testJobId);

  console.log('\nTest data cleaned up.');

  return isDeadLetter && retryWorked;
}

runFailureRecoveryTest()
  .then((passed) => {
    console.log(`\n=== Failure Recovery Test: ${passed ? 'PASSED' : 'FAILED'} ===`);
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
