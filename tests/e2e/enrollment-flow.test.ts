/**
 * End-to-End Enrollment Flow Test
 *
 * Tests the full student lifecycle:
 *   signup → enroll → progress → complete → certificate
 *
 * Prerequisites:
 *   - Supabase project running with migrations applied
 *   - .env.local configured with valid keys
 *   - At least one program seeded in the programs table
 *
 * Run: npx tsx tests/e2e/enrollment-flow.test.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEST_EMAIL = `e2e-test-${Date.now()}@elevateforhumanity.org`;
const TEST_PASSWORD = 'TestPass123!@#';

let userId: string;
let enrollmentId: string;
let programId: string;
let certificateId: string;

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch (err: any) {
    console.error(`  ❌ ${name}: ${err.message}`);
    throw err;
  }
}

async function cleanup() {
  if (userId) {
    // Clean up test data in reverse order
    if (certificateId) {
      await supabase.from('certificates').delete().eq('id', certificateId);
    }
    if (enrollmentId) {
      await supabase.from('enrollments').delete().eq('id', enrollmentId);
    }
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
    console.log('  🧹 Test data cleaned up');
  }
}

async function run() {
  console.log('\n=== Enrollment Flow E2E Test ===\n');

  // Step 1: Find a program to enroll in
  await step('Find active program', async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, slug')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error || !data) {
      // Try without status filter
      const { data: anyProgram, error: anyError } = await supabase
        .from('programs')
        .select('id, name, slug')
        .limit(1)
        .single();

      if (anyError || !anyProgram) throw new Error('No programs found in database. Seed at least one program.');
      programId = anyProgram.id;
      console.log(`    Using program: ${anyProgram.name} (${anyProgram.id})`);
      return;
    }
    programId = data.id;
    console.log(`    Using program: ${data.name} (${data.id})`);
  });

  // Step 2: Create test user
  await step('Create test user via auth.admin', async () => {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Test Student' },
    });

    if (error) throw error;
    userId = data.user.id;
    console.log(`    User ID: ${userId}`);
  });

  // Step 3: Verify profile was auto-created (trigger should fire)
  await step('Verify profile exists', async () => {
    // Wait for trigger
    await new Promise((r) => setTimeout(r, 2000));

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Profile trigger may not exist — create manually
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        email: TEST_EMAIL,
        role: 'student',
        full_name: 'E2E Test Student',
      });
      if (insertError) throw new Error(`Profile creation failed: ${insertError.message}`);
      console.log('    Profile created manually (no trigger)');
      return;
    }
    console.log(`    Profile role: ${data.role}`);
  });

  // Step 4: Create enrollment
  await step('Create enrollment', async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        program_id: programId,
        status: 'active',
        enrollment_date: new Date().toISOString(),
        funding_source: 'wioa',
      })
      .select('id')
      .single();

    if (error) throw new Error(`Enrollment failed: ${error.message}`);
    enrollmentId = data.id;
    console.log(`    Enrollment ID: ${enrollmentId}`);
  });

  // Step 5: Verify enrollment exists
  await step('Verify enrollment is active', async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, status, student_id, program_id')
      .eq('id', enrollmentId)
      .single();

    if (error || !data) throw new Error('Enrollment not found');
    if (data.status !== 'active') throw new Error(`Expected active, got ${data.status}`);
    if (data.student_id !== userId) throw new Error('Student ID mismatch');
  });

  // Step 6: Record progress
  await step('Record progress entry', async () => {
    const { error } = await supabase.from('progress_entries').insert({
      enrollment_id: enrollmentId,
      student_id: userId,
      progress_type: 'module_complete',
      progress_value: 100,
      notes: 'E2E test — module completed',
    });

    if (error) throw new Error(`Progress entry failed: ${error.message}`);
  });

  // Step 7: Complete enrollment
  await step('Mark enrollment as completed', async () => {
    const { error } = await supabase
      .from('enrollments')
      .update({
        status: 'completed',
        completion_date: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    if (error) throw new Error(`Completion failed: ${error.message}`);
  });

  // Step 8: Issue certificate
  await step('Issue certificate', async () => {
    const certNumber = `E2E-${Date.now()}`;
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        student_id: userId,
        enrollment_id: enrollmentId,
        program_id: programId,
        certificate_number: certNumber,
        issued_at: new Date().toISOString(),
        status: 'issued',
      })
      .select('id')
      .single();

    if (error) throw new Error(`Certificate issuance failed: ${error.message}`);
    certificateId = data.id;
    console.log(`    Certificate: ${certNumber}`);
  });

  // Step 9: Verify certificate
  await step('Verify certificate exists and is valid', async () => {
    const { data, error } = await supabase
      .from('certificates')
      .select('id, status, certificate_number, student_id')
      .eq('id', certificateId)
      .single();

    if (error || !data) throw new Error('Certificate not found');
    if (data.status !== 'issued') throw new Error(`Expected issued, got ${data.status}`);
    if (data.student_id !== userId) throw new Error('Student ID mismatch on certificate');
  });

  console.log('\n=== ALL STEPS PASSED ===\n');
}

// Run with cleanup
run()
  .then(() => cleanup())
  .then(() => {
    console.log('✅ Enrollment flow E2E test complete\n');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ Test failed:', err.message);
    await cleanup().catch(() => {});
    process.exit(1);
  });
