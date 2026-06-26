import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const KEEP = [
  '9feda5bd-c30b-458d-a22e-4890a1240336', // Austin Fletcher
  '4b6b02f7-6ceb-45bf-960d-6ae5e8545f77', // Pedro Carpintero
  '2d761d18-6ff9-4355-b9dd-5ff55903906b', // Natalia Roa
  'b35f3289-614b-4c6e-b029-73617fc46655', // Jordan White
  '70483e3b-30f1-4c58-8046-d068ab7356ee', // Mercedes Wellington
  '5f20c09c-7fd5-4aac-b2d2-aef12b78fbb2', // Adam Kriech
  '8e352e99-d552-4690-b8e7-8a560bb1f873', // Elizabeth Greene (partner)
  '4994cf7e-98dc-4337-968b-243957fff6c9', // Elizabeth L. Greene (admin)
  'b543fa81-69d4-4d6e-995a-e570e2aed0d2', // elevate4humanityedu
  '964dc85a-bce8-4e67-92eb-198ffafb2384', // curvaturebodysculpting
];

const STUDENTS = KEEP.slice(0, 5);

async function del(table: string, col: string, keepList: string[]) {
  // Supabase JS can't do NOT IN on UUIDs easily — use neq loop isn't practical
  // Instead: fetch all IDs in table, filter, then delete in batches
  const { data, error } = await db.from(table).select(col).returns<any[]>();
  if (error?.code === '42P01') { console.log(`  SKIP ${table} (table not found)`); return 0; }
  if (error) { console.log(`  WARN ${table}: ${error.message}`); return 0; }
  const toDelete = (data || []).map((r: any) => r[col]).filter((id: string) => id && !keepList.includes(id));
  if (!toDelete.length) { console.log(`  OK   ${table}: nothing to delete`); return 0; }
  const batchSize = 100;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const { error: de, count } = await db.from(table).delete({ count: 'exact' }).in(col, batch);
    if (de) { console.log(`  FAIL ${table} batch: ${de.message}`); }
    else deleted += count || 0;
  }
  console.log(`  OK   ${table}: deleted ${deleted} rows`);
  return deleted;
}

console.log('\nStarting account cleanup...\n');

// ── FK chain helpers ──────────────────────────────────────────────────────────

// 1. funding_verification_escalations blocks program_enrollments (via enrollment_id FK)
//    Delete escalations whose enrollment belongs to a non-student user
{
  const { data: badEnrollments } = await db
    .from('program_enrollments').select('id').not('user_id', 'in', `(${STUDENTS.join(',')})`);
  const ids = (badEnrollments || []).map((r: any) => r.id);
  if (ids.length) {
    const { count } = await db.from('funding_verification_escalations')
      .delete({ count: 'exact' }).in('enrollment_id', ids);
    console.log(`  OK   funding_verification_escalations: deleted ${count ?? 0} rows`);
  } else {
    console.log(`  OK   funding_verification_escalations: nothing to delete`);
  }
}

// 2. document_audit_log blocks documents (via document_id FK)
//    Delete audit log entries whose document belongs to a non-keep user
{
  const { data: badDocs } = await db
    .from('documents').select('id').not('user_id', 'in', `(${KEEP.join(',')})`);
  const ids = (badDocs || []).map((r: any) => r.id);
  if (ids.length) {
    const { count } = await db.from('document_audit_log')
      .delete({ count: 'exact' }).in('document_id', ids);
    console.log(`  OK   document_audit_log: deleted ${count ?? 0} rows`);
  } else {
    console.log(`  OK   document_audit_log: nothing to delete`);
  }
}

// 3. applications.reviewer_id blocks profiles
//    Null out reviewer_id for applications reviewed by users being deleted
{
  const { data: badProfiles } = await db
    .from('profiles').select('id').not('id', 'in', `(${KEEP.join(',')})`);
  const ids = (badProfiles || []).map((r: any) => r.id);
  if (ids.length) {
    await db.from('applications').update({ reviewer_id: null }).in('reviewer_id', ids);
    // Also delete applications where the applicant is being removed
    const { count } = await db.from('applications')
      .delete({ count: 'exact' }).in('user_id', ids);
    console.log(`  OK   applications: removed/nulled for ${ids.length} profiles being deleted`);
  }
}

// Step 1: Enrollments — keep only 5 students
await del('program_enrollments',  'user_id', STUDENTS);
await del('training_enrollments', 'user_id', STUDENTS);
await del('student_enrollments',  'user_id', STUDENTS);

// Step 2: Learning progress — keep all 10
await del('lesson_progress',                   'user_id', KEEP);
await del('checkpoint_scores',                 'user_id', KEEP);
await del('step_submissions',                  'user_id', KEEP);
await del('quiz_attempts',                     'user_id', KEEP);
await del('program_completion_certificates',   'user_id', KEEP);
await del('exam_funding_authorizations',       'user_id', KEEP);
await del('barber_lesson_progress',            'user_id', KEEP);
await del('barber_subscriptions',              'user_id', KEEP);

// Step 3: Other per-user data
await del('notifications',            'user_id', KEEP);
await del('documents',                'user_id', KEEP);
await del('case_manager_assignments', 'user_id', KEEP);
await del('mous',                     'user_id', KEEP);
await del('user_roles',               'user_id', KEEP);

// audit_logs has RLS with no DELETE policy — use the SECURITY DEFINER RPC
{
  const { data: allProfiles } = await db.from('profiles').select('id');
  const allIds = (allProfiles || []).map((r: any) => r.id);
  const toDelete = allIds.filter((id: string) => !KEEP.includes(id));
  if (toDelete.length) {
    const { data, error } = await db.rpc('admin_purge_audit_logs_for_users', { user_ids: toDelete });
    if (error) console.log(`  FAIL audit_logs RPC: ${error.message}`);
    else console.log(`  OK   audit_logs: deleted ${data} rows via RPC`);
  } else {
    // Also purge any orphaned rows where actor_id not in keep list
    const { data, error } = await db.rpc('admin_purge_audit_logs_for_users', { user_ids: ['00000000-0000-0000-0000-000000000001'] });
    // Just verify the RPC works
    const { data: d2, error: e2 } = await db.rpc('admin_purge_audit_logs_for_users', { user_ids: KEEP });
    if (e2) console.log(`  FAIL audit_logs RPC: ${e2.message}`);
    else console.log(`  OK   audit_logs: RPC available`);
  }
}

// Step 4: Profiles
await del('profiles', 'id', KEEP);

// Step 5: Auth users (service role can delete from auth.users via admin API)
console.log('\nDeleting auth users...');
const { data: allUsers } = await db.auth.admin.listUsers({ perPage: 1000 });
const toDeleteAuth = (allUsers?.users || []).filter(u => !KEEP.includes(u.id));
console.log(`  Found ${toDeleteAuth.length} auth users to delete`);
let authDeleted = 0;
for (const u of toDeleteAuth) {
  const { error } = await db.auth.admin.deleteUser(u.id);
  if (error) console.log(`  FAIL  ${u.email}: ${error.message}`);
  else authDeleted++;
}
console.log(`  Deleted ${authDeleted} auth users`);

// Verify
console.log('\nRemaining accounts:');
const { data: remaining } = await db.from('profiles').select('role,full_name,email').order('role');
for (const p of remaining || []) {
  console.log(`  ${String(p.role).padEnd(16)} ${p.email}  (${p.full_name})`);
}
