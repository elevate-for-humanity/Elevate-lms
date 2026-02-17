/**
 * End-to-End Enrollment Flow Test
 *
 * Tests the full student lifecycle:
 *   signup → profile (trigger) → enroll → progress → complete → certificate
 *
 * Prerequisites:
 *   - Supabase project running with migrations applied
 *   - .env.local configured with valid keys
 *   - At least one course in the courses table
 *
 * Run: npx tsx tests/e2e/enrollment-flow.test.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TENANT_ID = '6ba71334-58f4-4104-9b2a-5114f2a7614c'; // Elevate default tenant

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEST_EMAIL = `e2e-test-${Date.now()}@elevateforhumanity.org`;
const TEST_PASSWORD = 'TestPass123!@#';

let userId: string;
let enrollmentId: string;
let courseId: string;
let certificateId: string;

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  PASS ${name}`);
  } catch (err: any) {
    console.error(`  FAIL ${name}: ${err.message}`);
    throw err;
  }
}

async function cleanup() {
  if (userId) {
    if (certificateId) {
      await supabase.from('certificates').delete().eq('id', certificateId);
    }
    if (enrollmentId) {
      await supabase.from('enrollments').delete().eq('id', enrollmentId);
    }
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
    console.log('  Cleaned up test data');
  }
}

async function run() {
  console.log('\n=== Enrollment Flow E2E Test ===\n');

  // Step 1: Find a course to enroll in
  await step('Find a course', async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .limit(1)
      .single();

    if (error || !data) throw new Error('No courses found in database.');
    courseId = data.id;
    console.log(`    Course: ${data.title} (${data.id})`);
  });

  // Step 2: Create test user via admin API
  await step('Create test user', async () => {
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

  // Step 3: Verify profile auto-created by handle_new_user() trigger
  await step('Verify profile trigger fired', async () => {
    // Give the trigger time to execute
    await new Promise((r) => setTimeout(r, 2000));

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, tenant_id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error('Profile not created by trigger -- check handle_new_user() function');
    }
    if (data.tenant_id !== TENANT_ID) {
      throw new Error(`Expected tenant ${TENANT_ID}, got ${data.tenant_id}`);
    }
    console.log(`    Role: ${data.role}, Tenant: ${data.tenant_id}`);
  });

  // Step 4: Create enrollment (matches actual enrollments schema)
  await step('Create enrollment', async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        tenant_id: TENANT_ID,
      })
      .select('id')
      .single();

    if (error) throw new Error(`Enrollment failed: ${error.message}`);
    enrollmentId = data.id;
    console.log(`    Enrollment ID: ${enrollmentId}`);
  });

  // Step 5: Verify enrollment
  await step('Verify enrollment is active', async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, status, user_id, course_id')
      .eq('id', enrollmentId)
      .single();

    if (error || !data) throw new Error('Enrollment not found');
    if (data.status !== 'active') throw new Error(`Expected active, got ${data.status}`);
    if (data.user_id !== userId) throw new Error('User ID mismatch');
  });

  // Step 6: Update progress to 100%
  await step('Update progress to 100%', async () => {
    const { error } = await supabase
      .from('enrollments')
      .update({ progress: 100 })
      .eq('id', enrollmentId);

    if (error) throw new Error(`Progress update failed: ${error.message}`);
  });

  // Step 7: Complete enrollment
  await step('Mark enrollment completed', async () => {
    const { error } = await supabase
      .from('enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    if (error) throw new Error(`Completion failed: ${error.message}`);
  });

  // Step 8: Issue certificate (matches actual certificates schema)
  await step('Issue certificate', async () => {
    const certNumber = `E2E-${Date.now()}`;
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        student_id: userId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        certificate_number: certNumber,
        issued_at: new Date().toISOString(),
        tenant_id: TENANT_ID,
        metadata: {
          course_name: 'E2E Test Course',
          student_name: 'E2E Test Student',
          completion_date: new Date().toISOString().split('T')[0],
        },
      })
      .select('id')
      .single();

    if (error) throw new Error(`Certificate issuance failed: ${error.message}`);
    certificateId = data.id;
    console.log(`    Certificate: ${certNumber}`);
  });

  // Step 9: Verify certificate
  await step('Verify certificate', async () => {
    const { data, error } = await supabase
      .from('certificates')
      .select('id, certificate_number, user_id')
      .eq('id', certificateId)
      .single();

    if (error || !data) throw new Error('Certificate not found');
    if (data.user_id !== userId) throw new Error('User ID mismatch on certificate');
  });

  console.log('\n=== ALL STEPS PASSED ===\n');
}

run()
  .then(() => cleanup())
  .then(() => {
    console.log('Enrollment flow E2E test complete\n');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\nTest failed:', err.message);
    await cleanup().catch(() => {});
    process.exit(1);
  });
