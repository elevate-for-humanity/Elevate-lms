import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createQaAuthUser } from './supabase-auth-fixtures.mjs';
import { writePrivateQaState } from './write-private-state.mjs';
import { prepareQaHolderRosterProfile } from './holder-roster-fixture.mjs';

const action = process.argv[2] || 'provision';
const statePath = process.env.QA_PORTAL_E2E_STATE_PATH || '.qa-learner-program-holder-e2e-state.json';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

// The isolated QA project is the default. The release-acceptance workflow
// runs these fixtures against production with disposable, per-run identities
// (owner-approved 2026-11-24: throwaway users on the live site, removed by
// the workflow cleanup step). Production is allowed only with the explicit
// opt-in flag, and only for the production host — any other host is rejected.
const allowProductionDisposables =
  process.env.QA_E2E_ALLOW_PRODUCTION_DISPOSABLES === '1';
const qaHostname = new URL(supabaseUrl).hostname;
if (qaHostname !== 'isdgjcdabhxxozarmxta.supabase.co') {
  if (!(allowProductionDisposables && qaHostname === 'cuxzzpsyufcewtmicszk.supabase.co')) {
    throw new Error(
      'This fixture may run only against the isolated QA project, or against production with QA_E2E_ALLOW_PRODUCTION_DISPOSABLES=1',
    );
  }
}

const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const runId = String(process.env.QA_PORTAL_E2E_RUN_ID || process.env.GITHUB_RUN_ID || Date.now());
const marker = `qa-portal-e2e-${runId}`;
const QA_HVAC_COURSE_ID = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
// Production disposables must never be a paid enrollment: a paid row
// invites billing/reconciliation side effects that cleanup cannot fully
// unwind. In production mode the disposable enrollments are waived (free);
// the gate admits 'waived' as a settled payment status, and both
// enrollments already carry a recorded manual approval (approved_at +
// approved_by), which is the other prong the gate requires. QA mode
// keeps payment_status 'paid' so the isolated-QA playback path is
// unchanged.
const isProductionDisposable = new URL(supabaseUrl).hostname === 'cuxzzpsyufcewtmicszk.supabase.co';
const paymentStatus = isProductionDisposable ? 'waived' : 'paid';

function password() { return `Qa!${randomBytes(18).toString('base64url')}9x`; }
async function must(resultPromise, label) { const result = await resultPromise; if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; }

async function createQaUser(kind, role, fullName, tenantId) {
  const email = `${marker}-${kind}@qa.invalid`;
  const pass = password();
  const user = await createQaAuthUser({ db, email, password: pass, role, fullName, runId, label: `create ${kind} auth user` });
  await must(db.from('profiles').upsert({ id: user.id, email, full_name: fullName, role, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: 'id' }), `upsert ${kind} profile`);
  return { id: user.id, email, password: pass };
}

async function provision() {
  const anchor = await must(db.from('programs').select('id,organization_id,tenant_id').eq('slug', 'barber-apprenticeship').maybeSingle(), 'load tenant anchor');
  if (!anchor?.tenant_id) throw new Error('Canonical tenant anchor is missing');
  const adminEmail = String(process.env.E2E_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || '').trim().toLowerCase();
  let approvalAdminQuery = db
    .from('profiles')
    .select('id,role,tenant_id')
    .eq('tenant_id', anchor.tenant_id)
    .in('role', ['admin', 'super_admin']);
  if (adminEmail) approvalAdminQuery = approvalAdminQuery.eq('email', adminEmail);
  // In production mode, never resolve a real administrator as the
  // approver of a disposable test enrollment: without an explicit admin
  // email, only a fixture-created (qa.invalid) admin may approve.
  if (isProductionDisposable && !adminEmail) approvalAdminQuery = approvalAdminQuery.like('email', '%@qa.invalid');
  const approvalAdmins = await must(
    approvalAdminQuery.order('id', { ascending: true }).limit(1),
    'resolve authorized isolated-QA approval administrator',
  );
  const approvalAdmin = approvalAdmins?.[0];
  if (!approvalAdmin?.id)
    throw new Error('No authorized isolated-QA approval administrator is available');
  let state = { runId, marker, learner: null, programHolder: null, qaProgramId: null, holderId: null, holderProgramId: null, hvacEnrollmentId: null, holderStudent: null, holderEnrollmentId: null };
  try {
    const learner = await createQaUser('learner', 'student', '[QA E2E] Learner', anchor.tenant_id); state.learner = learner;
    // A disposable learner has real enrolled-course access for the live HVAC
    // playback test. No real learner scores, hours or approvals are touched.
    const hvac = await must(db.from('courses').select('id,program_id')
      .eq('id', QA_HVAC_COURSE_ID).eq('is_active', true).maybeSingle(), 'verify published HVAC course');
    if (!hvac?.program_id) throw new Error('Canonical active HVAC course unavailable for live QA');
    const qaHvac = await must(db.from('program_enrollments').insert({
      user_id: learner.id, student_id: learner.id, email: learner.email,
      full_name: '[QA E2E] Learner', program_id: hvac.program_id, course_id: hvac.id,
      program_slug: 'hvac-technician', status: 'active', enrollment_state: 'active',
      payment_status: paymentStatus, approved_at: new Date().toISOString(),
      approved_by: approvalAdmin.id, access_granted_at: new Date().toISOString(),
      access_status: 'active',
      funding_source: 'qa-e2e', funding_status: 'unfunded_self_continuing',
      funding_verified: false, amount_paid_cents: 0,
      source: 'qa-e2e', tenant_id: anchor.tenant_id,
      training_start_date: new Date().toISOString().slice(0, 10),
    }).select('id').single(), 'enroll isolated QA learner in HVAC playback course');
    state.hvacEnrollmentId = qaHvac.id;
    // Preserve the cleanup receipt even if later QA provisioning fails.
    await writePrivateQaState(statePath, state);
    const apprentice = await createQaUser('apprentice', 'apprentice', '[QA E2E] Barber Apprentice', anchor.tenant_id);
    state.apprentice = apprentice;
    await writePrivateQaState(statePath, state);
    const barberEnrollment = await must(db.from('program_enrollments').insert({
      user_id: apprentice.id, student_id: apprentice.id, email: apprentice.email,
      full_name: '[QA E2E] Barber Apprentice', program_id: anchor.id,
      program_slug: 'barber-apprenticeship', status: 'active', enrollment_state: 'active',
      payment_status: paymentStatus, approved_at: new Date().toISOString(), approved_by: approvalAdmin.id,
      access_granted_at: new Date().toISOString(), access_status: 'active',
      funding_source: 'qa-e2e', funding_status: 'unfunded_self_continuing',
      funding_verified: false, amount_paid_cents: 0, source: 'qa-e2e', tenant_id: anchor.tenant_id,
      training_start_date: new Date().toISOString().slice(0, 10),
    }).select('id').single(), 'enroll isolated QA apprentice with approved access');
    state.apprenticeEnrollmentId = barberEnrollment.id;
    await writePrivateQaState(statePath, state);
    const programHolder = await createQaUser('program-holder', 'program_holder', '[QA E2E] Program Holder', anchor.tenant_id); state.programHolder = programHolder;
    const qaProgram = await must(db.from('programs').insert({ slug: `${marker}-program`, title: '[QA E2E] Isolated Program Holder Program', name: '[QA E2E] Isolated Program Holder Program', category: 'qa', description: 'Disposable isolated program used only for responsive production QA.', is_active: false, published: false, status: 'draft', review_status: 'draft', tenant_id: anchor.tenant_id, organization_id: anchor.organization_id, funding_eligible: false, is_free: true, enrollment_state: 'closed' }).select('id,slug').single(), 'create isolated QA program'); state.qaProgramId = qaProgram.id;
    const holder = await must(db.from('program_holders').insert({ user_id: programHolder.id, organization_name: '[QA E2E] Isolated Program Holder', name: '[QA E2E] Program Holder', contact_name: '[QA E2E] Program Holder', contact_email: programHolder.email, status: 'approved', approved_at: new Date().toISOString(), mou_signed: true, mou_signed_at: new Date().toISOString(), mou_status: 'signed', is_using_internal_lms: true, payout_status: 'not_started', primary_program_id: qaProgram.id, teaches_multiple: false, features: { qa_e2e: true, qa_run_id: runId, isolated: true } }).select('id').single(), 'create isolated QA program holder'); state.holderId = holder.id;
    await must(db.from('profiles').update({ program_holder_id: holder.id }).eq('id', programHolder.id), 'link QA profile to program holder');
    const holderProgram = await must(db.from('program_holder_programs').insert({ program_holder_id: holder.id, program_id: qaProgram.id, program_slug: qaProgram.slug, role_in_program: 'owner', is_primary: true, status: 'active' }).select('id').single(), 'associate isolated QA program'); state.holderProgramId = holderProgram.id;
    await writePrivateQaState(statePath, state);
    // One enrolled student under the QA holder, so the holder portal's
    // roster and student progress report form have a real row to work with.
    // Without it the report form's submit button is disabled (no students)
    // and the roster is always empty. The enrollment is scoped to the holder
    // (program_holder_id) because the report API verifies ownership against
    // the holder before inserting a report.
    const holderStudent = await createQaUser('holder-student', 'student', '[QA E2E] Holder Student', anchor.tenant_id); state.holderStudent = holderStudent;
    await writePrivateQaState(statePath, state);
    const holderRosterProfile = await prepareQaHolderRosterProfile({
      db, supabaseUrl, runId, userId: holderStudent.id, allowProductionDisposables,
    });
    const holderEnrollment = await must(db.from('program_enrollments').insert({
      user_id: holderStudent.id, student_id: holderStudent.id, email: holderRosterProfile.email,
      full_name: holderRosterProfile.full_name, program_id: qaProgram.id, program_slug: qaProgram.slug,
      program_holder_id: holder.id,
      status: 'active', enrollment_state: 'active',
      payment_status: paymentStatus, approved_at: new Date().toISOString(),
      approved_by: approvalAdmin.id,
      funding_source: 'qa-e2e', funding_status: 'unfunded_self_continuing',
      funding_verified: false, amount_paid_cents: 0,
      source: 'qa-e2e', tenant_id: anchor.tenant_id,
      training_start_date: new Date().toISOString().slice(0, 10),
    }).select('id').single(), 'enroll isolated QA student under program holder');
    state.holderEnrollmentId = holderEnrollment.id;
    await writePrivateQaState(statePath, state);
    // A two-student roster under the same holder, so roster filtering can
    // distinguish an active enrollment from a completed one.
    const roster = [
      { kind: 'holder-active-student', name: 'QA Holder Active Student', status: 'active' },
      { kind: 'holder-completed-student', name: 'QA Holder Completed Student', status: 'completed' },
    ];
    state.holderRoster = [];
    for (const { kind, name, status } of roster) {
      const student = await createQaUser(kind, 'student', name, anchor.tenant_id);
      const record = { id: student.id, enrollmentId: null };
      state.holderRoster.push(record);
      await writePrivateQaState(statePath, state);
      const enrollment = await must(db.from('program_enrollments').insert({
        user_id: student.id, student_id: student.id, email: student.email, full_name: name,
        program_holder_id: holder.id, program_id: qaProgram.id, program_slug: qaProgram.slug,
        tenant_id: anchor.tenant_id, status, enrollment_state: status, source: 'qa-e2e',
      }).select('id').single(), `enroll ${kind} in the isolated holder roster`);
      record.enrollmentId = enrollment.id;
      await writePrivateQaState(statePath, state);
    }
    if (process.env.GITHUB_ENV) {
      await writeFile(process.env.GITHUB_ENV, [
        `E2E_LEARNER_EMAIL=${learner.email}`,
        `E2E_LEARNER_PASSWORD=${learner.password}`,
        `TEST_STUDENT_EMAIL=${learner.email}`,
        `TEST_STUDENT_PASSWORD=${learner.password}`,
        `E2E_PROGRAM_HOLDER_EMAIL=${programHolder.email}`,
        `E2E_PROGRAM_HOLDER_PASSWORD=${programHolder.password}`,
        `TEST_PROGRAM_HOLDER_EMAIL=${programHolder.email}`,
        `TEST_PROGRAM_HOLDER_PASSWORD=${programHolder.password}`,
        `E2E_APPRENTICE_EMAIL=${apprentice.email}`,
        `E2E_APPRENTICE_PASSWORD=${apprentice.password}`,
      ].join('\n') + '\n', { flag: 'a' });
      console.log(`::add-mask::${learner.password}`); console.log(`::add-mask::${programHolder.password}`);
      console.log(`::add-mask::${apprentice.password}`);
    }
    console.log(JSON.stringify({ ok: true, learnerUserId: learner.id, programHolderUserId: programHolder.id, holderId: holder.id, qaProgramId: qaProgram.id }));
  } catch (error) { await writePrivateQaState(statePath, state).catch(() => {}); await cleanup().catch((cleanupError) => console.error('cleanup after provision failure:', cleanupError)); throw error; }
}

async function cleanup() {
  let state;
  try { state = JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.log('No Learner/Program Holder QA state file found; nothing to clean up.');
    return;
  }
  if (!state.runId || state.marker !== `qa-portal-e2e-${state.runId}`)
    throw new Error('QA cleanup rejected an invalid run marker');
  const checked = async (promise, label) => {
    const { data, error } = await promise;
    if (error) throw new Error(`QA cleanup ${label}: ${error.message}`);
    return data;
  };
  const read = (table, id, columns) => id
    ? checked(db.from(table).select(columns).eq('id', id).maybeSingle(), `read ${table}`)
    : null;
  const requireBinding = (valid, label) => {
    if (!valid) throw new Error(`QA cleanup rejected mismatched ${label}`);
  };
  const deleteOne = async (query, label) => {
    const rows = await checked(query.select('id'), `delete ${label}`);
    if (rows?.length !== 1) throw new Error(`QA cleanup ${label} changed before deletion`);
  };
  const authMissing = error => error?.status === 404 || error?.code === 'user_not_found';

  // Derived tables may not exist in the isolated QA project (minimal
  // schema). A missing table means no derived rows could have been
  // created there, so "table does not exist" is ignored; every other
  // error still fails cleanup.
  const isMissingTableError = (error) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    return code === 'PGRST205' || /could not find the table|relation .* does not exist|42P01/i.test(message);
  };
  const deleteDerived = async (promise, label) => {
    const { error } = await promise;
    if (error && !isMissingTableError(error)) throw new Error('QA cleanup ' + label + ': ' + error.message);
  };
  const assertDerivedGone = async (promise, label) => {
    const { data, error } = await promise;
    if (error) {
      if (isMissingTableError(error)) return;
      throw new Error('QA cleanup verify ' + label + ': ' + error.message);
    }
    if ((data || []).length) throw new Error('QA cleanup incomplete: ' + label);
  };
  const deleteEnrollmentDerived = async (enrollmentId) => {
    // Trigger-derived outbox and queue rows. The welcome email and the
    // platform event are created for ANY active enrollment (not only paid
    // ones), so they must be removed even in the waived production path.
    // The enrollment_insert_audit row is intentionally retained: it is an
    // append-only audit trail of the fixture insert.
    await deleteDerived(db.from('notification_outbox').delete()
      .eq('template_key', 'enrollment_welcome').eq('entity_type', 'program_enrollment')
      .eq('entity_id', enrollmentId), 'delete welcome outbox entry');
    await deleteDerived(db.from('platform_events').delete()
      .eq('event_type', 'enrollment.confirmed').eq('subject_type', 'program_enrollment')
      .eq('subject_id', enrollmentId), 'delete enrollment platform event');
    // Fixture alerts must never outlive teardown (Blocker A, 2026-11-26):
    // the RAPIDS queue + staff alert and the program-holder 'New Student
    // Assigned' notification are trigger-derived from the enrollment row.
    // The triggers also skip qa-e2e fixtures at the source (migration
    // 20261126173000); these deletes are the backstop for rows created
    // before that migration or by any other derived path.
    await deleteDerived(db.from('rapids_action_queue').delete()
      .eq('entity_type', 'apprentice').eq('entity_id', enrollmentId)
      .eq('action_type', 'register_apprentice'), 'delete RAPIDS queue entry');
    await deleteDerived(db.from('staff_notifications').delete()
      .eq('type', 'apprentice_ready_for_rapids')
      .eq('metadata->>enrollment_id', enrollmentId), 'delete RAPIDS staff notification');
    await deleteDerived(db.from('notifications').delete()
      .eq('metadata->>enrollment_id', enrollmentId), 'delete holder enrollment notification');
  };
  const assertEnrollmentDerivedGone = async (enrollmentId, label) => {
    await assertDerivedGone(db.from('program_holder_students')
      .select('id').eq('enrollment_id', enrollmentId).limit(1), label + ' holder-student link');
    await assertDerivedGone(db.from('notification_outbox')
      .select('id').eq('template_key', 'enrollment_welcome')
      .eq('entity_type', 'program_enrollment').eq('entity_id', enrollmentId).limit(1), label + ' welcome outbox entry');
    await assertDerivedGone(db.from('platform_events')
      .select('id').eq('event_type', 'enrollment.confirmed')
      .eq('subject_type', 'program_enrollment').eq('subject_id', enrollmentId).limit(1), label + ' enrollment platform event');
    await assertDerivedGone(db.from('staff_notifications')
      .select('id').eq('type', 'apprentice_ready_for_rapids')
      .eq('metadata->>enrollment_id', enrollmentId).limit(1), label + ' RAPIDS staff notification');
    await assertDerivedGone(db.from('notifications')
      .select('id').eq('metadata->>enrollment_id', enrollmentId).limit(1), label + ' holder enrollment notification');
  };
  if (state.learner?.id) {
    // Remove only this run's disposable HVAC simulation evidence; real learner
    // history and other interaction categories remain outside this cleanup.
    await deleteDerived(db.from('interaction_progress').delete()
      .eq('learner_id', state.learner.id).eq('course_id', QA_HVAC_COURSE_ID)
      .eq('interaction_type', 'simulation').like('interaction_id', 'hvac-sim:%'),
    'delete disposable HVAC simulation progress');
    await assertDerivedGone(db.from('interaction_progress').select('id')
      .eq('learner_id', state.learner.id).eq('course_id', QA_HVAC_COURSE_ID)
      .eq('interaction_type', 'simulation').like('interaction_id', 'hvac-sim:%').limit(1),
    'disposable HVAC simulation progress');
    // Playback stores QA events, never formal credits. Remove only this run's
    // disposable learner rows before its profile and login are removed.
    for (const table of [
      'video_playback_events',
      'learner_video_checkpoint_responses',
      'interactive_video_quiz_answers',
      'learner_video_notes',
      'learner_video_progress',
      'checkpoint_scores',
      'lesson_progress',
    ]) {
      const { error } = await db.from(table).delete().eq('user_id', state.learner.id);
      if (error) throw new Error('QA playback cleanup failed for ' + table + ': ' + error.message);
    }
    // Isolated QA's resumes table has no profile cascade on soft auth deletion.
    // Remove only this run's disposable learner rows before profile removal.
    await must(db.from('resumes').delete().eq('user_id', state.learner.id),
      'remove isolated QA learner resumes');
    const remainingResumes = await must(
      db.from('resumes').select('id').eq('user_id', state.learner.id).limit(1),
      'verify isolated QA learner resume cleanup',
    );
    if (remainingResumes?.length) {
      throw new Error('QA learner resume cleanup left disposable learner rows');
    }
  }
  if (hvac) await deleteDerived(db.from('program_holder_students').delete()
    .eq('enrollment_id', state.hvacEnrollmentId), 'delete HVAC holder-student link');
  if (hvac) await deleteOne(db.from('program_enrollments').delete().eq('id', hvac.id)
    .eq('user_id', state.learner.id).eq('student_id', state.learner.id)
    .eq('course_id', QA_HVAC_COURSE_ID).eq('source', 'qa-e2e'), 'HVAC enrollment');
  if (hvac) await deleteEnrollmentDerived(state.hvacEnrollmentId);
  const reportQuery = remove => (remove ? db.from('program_holder_reports').delete() : db.from('program_holder_reports').select('id'))
    .eq('program_holder_id', state.holderId).eq('user_id', state.programHolder.id)
    .eq('report_type', 'student_progress').contains('metadata', { enrollment_id: state.holderEnrollmentId });
  const reportScope = state.holderEnrollmentId && state.programHolder?.id && state.holderId;
  if (reportScope && (enrollment || holder)) {
    await checked(reportQuery(true), 'delete holder reports');
  }
  if (state.apprenticeEnrollmentId) {
    await must(db.from('program_enrollments').delete().eq('id', state.apprenticeEnrollmentId).eq('user_id', state.apprentice.id), 'remove isolated apprentice enrollment');
    await must(db.from('course_enrollments').delete().eq('student_id', state.apprentice.id), 'remove isolated apprentice course enrollments');
    await deleteEnrollmentDerived(state.apprenticeEnrollmentId);
  }
  if (state.apprenticeEnrollmentId) {
    await must(db.from('program_enrollments').delete().eq('id', state.apprenticeEnrollmentId).eq('user_id', state.apprentice.id), 'remove isolated apprentice enrollment');
    await must(db.from('course_enrollments').delete().eq('student_id', state.apprentice.id), 'remove isolated apprentice course enrollments');
    await deleteEnrollmentDerived(state.apprenticeEnrollmentId);
  }
  if (state.holderEnrollmentId && state.holderStudent?.id) {
    await deleteDerived(db.from('program_holder_students').delete()
      .eq('enrollment_id', state.holderEnrollmentId), 'delete holder holder-student link');
    const { data, error } = await db.from('program_enrollments').delete()
      .eq('id', state.holderEnrollmentId).eq('user_id', state.holderStudent.id).select('id');
    if (error || data?.length !== 1)
      throw new Error('QA holder-student enrollment cleanup was not independently confirmed: ' + (error?.message || 'row count mismatch'));
    // The sync trigger mirrors program enrollments into course_enrollments
    // for the holder student too; the old cleanup only removed the
    // learner's mirrored rows.
    const { error: holderCourseError } = await db.from('course_enrollments').delete()
      .eq('student_id', state.holderStudent.id);
    if (holderCourseError) throw new Error('QA holder course enrollment cleanup failed: ' + holderCourseError.message);
    await deleteEnrollmentDerived(state.holderEnrollmentId);
  }
  for (const student of state.holderRoster ?? []) {
    if (student.enrollmentId) {
      await must(db.from('program_enrollments').delete().eq('id', student.enrollmentId).eq('user_id', student.id), 'remove isolated holder roster enrollment');
    }
  }
  if (state.holderProgramId) await must(db.from('program_holder_programs').delete().eq('id', state.holderProgramId), 'remove isolated holder program association');
  if (state.holderId) await must(db.from('program_holders').delete().eq('id', state.holderId), 'remove isolated holder and reports');
  if (state.qaProgramId) await db.from('programs').delete().eq('id', state.qaProgramId);
  for (const userId of [state.learner?.id, state.apprentice?.id, state.programHolder?.id, state.holderStudent?.id, ...(state.holderRoster ?? []).map((student) => student.id)].filter(Boolean)) {
    await db.from('profiles').delete().eq('id', userId);
    const { error } = await db.auth.admin.deleteUser(userId, true);
    if (error && !/not found/i.test(error.message)) console.error(`soft-delete auth user ${userId}: ${error.message}`);
  }
  // Verify the trigger-derived rows are gone (skipped where the table
  // does not exist in the QA project).
  if (state.learner?.id) await assertDerivedGone(db.from('course_enrollments')
    .select('id').eq('student_id', state.learner.id).limit(1), 'learner course enrollments');
  if (state.holderStudent?.id) await assertDerivedGone(db.from('course_enrollments')
    .select('id').eq('student_id', state.holderStudent.id).limit(1), 'holder-student course enrollments');
  if (state.hvacEnrollmentId) await assertEnrollmentDerivedGone(state.hvacEnrollmentId, 'HVAC');
  if (state.holderEnrollmentId) await assertEnrollmentDerivedGone(state.holderEnrollmentId, 'holder-student');
  if (state.apprenticeEnrollmentId) await assertEnrollmentDerivedGone(state.apprenticeEnrollmentId, 'apprentice');
  console.log(JSON.stringify({ ok: true, cleanedRunId: state.runId }));
}

if (action === 'provision') await provision(); else if (action === 'cleanup') await cleanup(); else throw new Error(`Unknown action: ${action}`);
