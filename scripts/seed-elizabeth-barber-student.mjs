#!/usr/bin/env node
/**
 * Idempotent: wire Elizabeth Greene as an active barber apprenticeship student
 * for dashboard / E2E testing (founder account used as QA student).
 *
 *   pnpm tsx --env-file=.env.local scripts/seed-elizabeth-barber-student.mjs
 */
import { createClient } from '@supabase/supabase-js';

const EMAIL = 'elizabethpowell6262@gmail.com';
const PROGRAM_SLUG = 'barber-apprenticeship';
const PROGRAM_ID = '5ff21fcb-1968-41fd-99d3-37d69a31bd5c';
const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const DEFAULT_SHOP_ID = '66833b02-ec3f-4a6e-a7e0-00268d3cf7ed';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === 'placeholder') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(url, key);
const now = new Date().toISOString();

const { data: profile, error: profileErr } = await db
  .from('profiles')
  .select('id, email, full_name, role')
  .eq('email', EMAIL)
  .maybeSingle();

if (profileErr || !profile) {
  console.error('Profile not found for', EMAIL, profileErr?.message);
  process.exit(1);
}

const userId = profile.id;
console.log('User:', userId, profile.full_name, `role=${profile.role}`);

const { data: existingPe } = await db
  .from('program_enrollments')
  .select('id')
  .eq('user_id', userId)
  .eq('program_slug', PROGRAM_SLUG)
  .maybeSingle();

let enrollmentId = existingPe?.id;

if (!enrollmentId) {
  const { data: inserted, error } = await db
    .from('program_enrollments')
    .insert({
      user_id: userId,
      student_id: userId,
      program_id: PROGRAM_ID,
      program_slug: PROGRAM_SLUG,
      course_id: COURSE_ID,
      email: EMAIL,
      full_name: profile.full_name ?? 'Elizabeth Greene',
      status: 'active',
      enrollment_state: 'active',
      funding_source: 'self_pay',
      payment_status: 'paid',
      enrolled_at: now,
      enrollment_confirmed_at: now,
      orientation_completed_at: now,
      documents_completed_at: now,
      access_granted_at: now,
      start_date: now,
      program_holder_id: DEFAULT_SHOP_ID,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error) {
    console.error('program_enrollments insert failed:', error.message);
    process.exit(1);
  }
  enrollmentId = inserted.id;
  console.log('Created program_enrollments', enrollmentId);
} else {
  const { error } = await db
    .from('program_enrollments')
    .update({
      status: 'active',
      enrollment_state: 'active',
      course_id: COURSE_ID,
      orientation_completed_at: now,
      documents_completed_at: now,
      access_granted_at: now,
      updated_at: now,
    })
    .eq('id', enrollmentId);
  if (error) console.warn('program_enrollments update:', error.message);
  else console.log('Updated program_enrollments', enrollmentId);
}

const { data: existingSub } = await db
  .from('barber_subscriptions')
  .select('id')
  .eq('user_id', userId)
  .maybeSingle();

if (!existingSub) {
  const { error } = await db.from('barber_subscriptions').insert({
    user_id: userId,
    enrollment_id: enrollmentId,
    customer_email: EMAIL,
    customer_name: profile.full_name ?? 'Elizabeth Greene',
    status: 'active',
    payment_status: 'active',
    setup_fee_paid: true,
    fully_paid: false,
    weekly_payment_cents: 15103,
    remaining_balance: 5000,
    payment_model: 'weekly',
    created_at: now,
    updated_at: now,
  });
  if (error) console.warn('barber_subscriptions insert:', error.message);
  else console.log('Created barber_subscriptions');
} else {
  await db
    .from('barber_subscriptions')
    .update({ status: 'active', setup_fee_paid: true, updated_at: now })
    .eq('id', existingSub.id);
  console.log('Updated barber_subscriptions', existingSub.id);
}

const { data: existingApprentice } = await db
  .from('apprentices')
  .select('id')
  .eq('user_id', userId)
  .maybeSingle();

if (!existingApprentice) {
  const { error } = await db.from('apprentices').insert({
    user_id: userId,
    shop_id: DEFAULT_SHOP_ID,
    status: 'active',
    start_date: now.split('T')[0],
    created_at: now,
    updated_at: now,
  });
  if (error) console.warn('apprentices insert:', error.message);
  else console.log('Created apprentices row');
} else {
  await db
    .from('apprentices')
    .update({ shop_id: DEFAULT_SHOP_ID, status: 'active', updated_at: now })
    .eq('id', existingApprentice.id);
  console.log('Updated apprentices', existingApprentice.id);
}

await db.from('lms_progress').upsert(
  {
    user_id: userId,
    course_id: COURSE_ID,
    course_slug: 'barber-apprenticeship-v1',
    status: 'in_progress',
    progress_percent: 0,
    started_at: now,
    last_activity_at: now,
  },
  { onConflict: 'user_id,course_id' },
);

console.log('\n✅ Elizabeth barber student fixture ready');
console.log('   Dashboard: https://www.elevateforhumanity.org/portal/barber');
console.log('   LMS course:', `https://www.elevateforhumanity.org/lms/courses/${COURSE_ID}`);
