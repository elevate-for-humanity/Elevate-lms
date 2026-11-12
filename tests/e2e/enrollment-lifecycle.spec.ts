/**
 * Student enrollment lifecycle against Supabase:
 *   signup → profile (handle_new_user trigger) → enroll → progress → complete → certificate
 *
 * Formerly tests/e2e/enrollment-flow.test.ts, a standalone tsx script that no
 * runner picked up. It writes (and then removes) a disposable user, enrollment
 * and certificate, so it runs only when explicitly enabled:
 *
 *   E2E_DB_LIFECYCLE=1 NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *     pnpm exec playwright test tests/e2e/enrollment-lifecycle.spec.ts --project=desktop-chrome
 */
import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TENANT_ID = '6ba71334-58f4-4104-9b2a-5114f2a7614c'; // Elevate default tenant

test.describe.serial('Enrollment lifecycle (Supabase)', () => {
  test.skip(
    process.env.E2E_DB_LIFECYCLE !== '1' || !SUPABASE_URL || !SERVICE_KEY,
    'Set E2E_DB_LIFECYCLE=1, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run (writes disposable records)',
  );
  test.skip(({ browserName }) => browserName !== 'chromium', 'Database lifecycle is device-independent');

  let supabase: SupabaseClient;
  let userId = '';
  let enrollmentId = '';
  let courseId = '';
  let certificateId = '';

  test.beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    if (!userId) return;
    if (certificateId) await supabase.from('certificates').delete().eq('id', certificateId);
    if (enrollmentId) await supabase.from('enrollments').delete().eq('id', enrollmentId);
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
  });

  test('finds a course', async () => {
    const { data, error } = await supabase.from('courses').select('id, title').limit(1).single();
    expect(error, 'No courses found in database').toBeNull();
    courseId = data!.id;
  });

  test('creates a test user', async () => {
    const { data, error } = await supabase.auth.admin.createUser({
      email: `e2e-test-${Date.now()}@elevateforhumanity.org`,
      password: `E2e-${crypto.randomUUID()}`,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Test Student' },
    });
    expect(error).toBeNull();
    userId = data.user!.id;
  });

  test('handle_new_user() creates the profile in the default tenant', async () => {
    await expect
      .poll(async () => {
        const { data } = await supabase.from('profiles').select('id, tenant_id').eq('id', userId).maybeSingle();
        return data?.tenant_id ?? null;
      }, { message: 'Profile not created by handle_new_user()', timeout: 15_000 })
      .toBe(TENANT_ID);
  });

  test('creates an active enrollment', async () => {
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
      .select('id, status, user_id, course_id')
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ status: 'active', user_id: userId, course_id: courseId });
    enrollmentId = data!.id;
  });

  test('records 100% progress and completion', async () => {
    const progress = await supabase.from('enrollments').update({ progress: 100 }).eq('id', enrollmentId);
    expect(progress.error).toBeNull();
    const completion = await supabase
      .from('enrollments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', enrollmentId);
    expect(completion.error).toBeNull();
  });

  test('issues and verifies a certificate', async () => {
    const certificateNumber = `E2E-${Date.now()}`;
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        student_id: userId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        certificate_number: certificateNumber,
        issued_at: new Date().toISOString(),
        tenant_id: TENANT_ID,
        metadata: {
          course_name: 'E2E Test Course',
          student_name: 'E2E Test Student',
          completion_date: new Date().toISOString().split('T')[0],
        },
      })
      .select('id, certificate_number, user_id')
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ certificate_number: certificateNumber, user_id: userId });
    certificateId = data!.id;
  });
});
