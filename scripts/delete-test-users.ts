#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error('missing env'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });

// Confirmed test account IDs from audit. These have test/demo/e2e/fake domain emails
// and/or were never used for real production activity.
const TEST_IDS = [
  'a1c2870e-3dfb-4da2-b103-20ca13ddaf2d', // cosmo.test@elevateforhumanity.org
  '10f311ad-9ee6-4bde-ac62-dac922fba024', // dana-employer-1775825794@elevate-demo.test
  '9c8ba3bb-efbb-4a9d-a794-ea67129db43f', // delegate@test.com
  'd65956de-aa79-4ca9-af03-8b3ed4391ca7', // devstudio.e2e.1778336265@example.com
  'de833f06-7939-46e7-b3e7-5d35a399a37c', // e2e-admin@elevate-test.internal
  '2c0f62a5-307f-4c34-9ab7-26d3d4fa9212', // e2e-emp-1775822131@elevate.test
  'a863aad2-5082-4af3-b8e0-6c82997b212b', // e2e-emp-1775822195@elevate.test
  '515b0d8d-3d49-4033-b4aa-6d79d8b4b7aa', // e2e-emp-1775822278@elevate.test
  'fa96ff3a-6d5a-49ce-9765-bd1f1b1e6acc', // e2e-emp-1775824645@elevate.test
  '5c7a6fd7-b2f9-4457-b984-ea0878acbc3f', // e2e-emp-1775824708@elevate.test
  '135a29b1-58ed-4ffb-8aeb-f86efdf79661', // e2e-employer@elevate.test
  'fdc7c0c4-d2be-4e3a-9e99-e42dfe344fe8', // e2e-final-...@test.elevateforhumanity.org
  'e27c62cb-8baf-42de-b52a-39787d783a01', // e2e-upload-...@test.elevateforhumanity.org
  '63377a99-5a6d-4956-9749-f84c048d60eb', // e2e-upload-...@test.com
  '6ffc1c51-7dea-49b1-bbc1-bf369e8e5496', // e2e-v2-...@test.elevateforhumanity.org
  'a3090fdf-0165-40fe-a814-f3fa1877f583', // emp-fresh-...@elevate-demo.test
  'ac6070db-bf7d-4156-a122-781aa206c17f', // employer@test.com
  'c7658ba6-6082-43cf-8273-3f40f5125bfa', // jozanna.george+admin@elevate-test.dev
  '7edaa972-d2fb-4092-8932-3170efcfabe0', // jozanna.george+instructor@elevate-test.dev
  '6f7af1f5-bf45-4c3d-ae05-49a0e3d5b406', // jozanna.george+program_holder@elevate-test.dev
  'db8ce755-bbe6-42a1-afaa-e9d45dd2947d', // jozanna.george+staff@elevate-test.dev
  'f19d1438-e4c2-409c-83f1-b179cb8b005b', // jozanna.george+student@elevate-test.dev
  '2596804e-7f7f-4a1f-9f6d-8a8c513861c9', // jozanna.test.elevate@gmail.com
  'a8b15be7-8457-4c8c-b25e-9b678217a81d', // mou-test@elevate.test
  '98b27a24-d138-463e-b412-2be3e6083178', // robert-emp-...@acme-hvac.test
  '79b45154-71d9-4eca-b3c0-ac0de0a612a0', // sig-employer@elevate.test
  '70371090-5db5-4600-8f6a-aa3d214496f3', // test-1771850780165@elevatetest.com
  'be61a831-8cc7-4c72-a0ae-23919b62bbb0', // test-1771850816605@elevatetest.com
  '788281f1-94af-4d5f-9ecc-81cb8d9fb5a6', // test-1771850901944@elevatetest.com
  '41ff0c70-b20c-4323-a6cb-1555fee693bd', // test-1771851104613@elevatetest.com
  '94ea6553-1b4d-4ff8-aef6-bf1611e2ac57', // test-1771851129899@elevatetest.com
  '4fe78a44-dfa2-47ab-9ab7-04b3ce62bb49', // test-1771851484971@elevatetest.com
  '40dab463-637a-4fdf-8d42-060d170da446', // test-1771851504257@elevatetest.com
  '8ad39628-9b92-4c87-a3ad-72eb60b670b1', // test-1771851546245@elevatetest.com
  '5c1f263b-3299-46d0-8bc9-147b848f7b0a', // test-1771851599189@elevatetest.com
  '35392994-1058-475e-b2d6-c894e5f58ddb', // test-1771851711188@elevatetest.com
  '2acb2201-8715-4152-9f69-51c502ed7a1d', // test-1771851731524@elevatetest.com
  '9669c34e-2bfa-4e3f-8f82-5f0e8acff27f', // test-1771854960913@elevatetest.com
  'd1cf95b3-2d7b-40c6-8f33-eafb4d58ad7a', // test-employer-...@elevate-demo.test
  '3d654b07-d4b6-47c4-83f2-090aabb3a138', // test-employer@elevate-demo.test
  'a2017936-5a63-4d11-938d-2a1df0802e52', // test-student-...@elevatetest.com
  'f73f1de4-3e9a-43e9-a1e1-188bfc54bdb8', // test-student-...@elevatetest.com
  '24092950-75e6-44fb-bf4b-e16fa9eb7fcb', // testadmin@elevateforhumanity.org
  '8f3219c4-67c1-4772-885b-0c06e66356da', // trigger-test@elevate.test
  'b2cdf0e3-1756-43d9-88ce-bad68bd2a5a8', // upload-noprofile-...@test.com
  '5e889f22-7609-4a5c-8f18-5f19108a19e5', // upload-test-...@test.com
  '4ad732f6-2c24-4c6f-95c3-b1c5b3eaae36', // upload-test@resend.dev
  '3a63e7fd-595b-4602-b212-020752552efc', // validate-barber-...@test-elevate.internal
];

// Also delete placeholder-domain "student.elevate.edu" ghost accounts
const GHOST_PLACEHOLDER = [
  // no-profile student.elevate.edu accounts – never real users
];

const ALL_TO_DELETE = [...TEST_IDS, ...GHOST_PLACEHOLDER];

// Tables that reference auth.users(id) directly or via profiles(id)
// Must be cleaned in dependency order before auth user can be deleted
const DEPENDENT_TABLES: Array<{ table: string; col: string }> = [
  // deep children first
  { table: 'lesson_progress',                  col: 'user_id' },
  { table: 'checkpoint_scores',                col: 'user_id' },
  { table: 'step_submissions',                 col: 'user_id' },
  { table: 'quiz_attempts',                    col: 'user_id' },
  { table: 'program_completion_certificates',  col: 'user_id' },
  { table: 'exam_funding_authorizations',      col: 'user_id' },
  { table: 'barber_lesson_progress',           col: 'user_id' },
  { table: 'barber_subscriptions',             col: 'user_id' },
  { table: 'training_enrollments',             col: 'user_id' },
  { table: 'program_enrollments',              col: 'user_id' },
  { table: 'enrollments',                      col: 'user_id' },
  { table: 'notifications',                    col: 'user_id' },
  { table: 'user_sessions',                    col: 'user_id' },
  { table: 'documents',                        col: 'user_id' },
  { table: 'case_manager_assignments',         col: 'user_id' },
  { table: 'mous',                             col: 'user_id' },
  // audit_logs uses actor_id
  { table: 'audit_logs',                       col: 'actor_id' },
  // profile last (direct FK to auth.users, uses id not user_id)
  { table: 'profiles',                         col: 'id' },
];

let deleted = 0;
let failed = 0;

console.log(`\nDeleting ${ALL_TO_DELETE.length} test/ghost accounts...\n`);

for (const id of ALL_TO_DELETE) {
  // 1. Delete dependent rows
  for (const { table, col } of DEPENDENT_TABLES) {
    await (db.from(table) as any).delete().eq(col, id);
  }

  // 2. Delete auth user
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) {
    console.error(`  FAIL ${id}: ${error.message}`);
    failed++;
  } else {
    console.log(`  OK   ${id}`);
    deleted++;
  }
}

console.log(`\nDone. deleted=${deleted}  failed=${failed}`);
