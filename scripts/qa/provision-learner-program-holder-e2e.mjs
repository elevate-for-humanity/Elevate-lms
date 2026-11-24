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
  const anchor = await must(db.from('programs').select('organization_id,tenant_id').eq('slug', 'barber-apprenticeship').maybeSingle(), 'load tenant anchor');
  if (!anchor?.tenant_id) throw new Error('Canonical tenant anchor is missing');
  const adminEmail = String(process.env.E2E_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || '').trim().toLowerCase();
  let approvalAdminQuery = db
    .from('profiles')
    .select('id,role,tenant_id')
    .eq('tenant_id', anchor.tenant_id)
    .in('role', ['admin', 'super_admin']);
  if (adminEmail) approvalAdminQuery = approvalAdminQuery.eq('email', adminEmail);
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
      payment_status: 'paid', approved_at: new Date().toISOString(),
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
      payment_status: 'paid', approved_at: new Date().toISOString(),
      approved_by: approvalAdmin.id,
      funding_source: 'qa-e2e', funding_status: 'unfunded_self_continuing',
      funding_verified: false, amount_paid_cents: 0,
      source: 'qa-e2e', tenant_id: anchor.tenant_id,
      training_start_date: new Date().toISOString().slice(0, 10),
    }).select('id').single(), 'enroll isolated QA student under program holder');
    state.holderEnrollmentId = holderEnrollment.id;
    await writePrivateQaState(statePath, state);
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
      ].join('\n') + '\n', { flag: 'a' });
      console.log(`::add-mask::${learner.password}`); console.log(`::add-mask::${programHolder.password}`);
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

  // Validate every checkpointed object before any mutation. A corrupt or stale
  // checkpoint must not turn one verified QA login into authority over another
  // holder, program, enrollment, or student's report.
  const program = await read('programs', state.qaProgramId, 'id,slug,category');
  if (program) requireBinding(program.slug === `${state.marker}-program` && program.category === 'qa', 'program');
  const holder = await read('program_holders', state.holderId, 'id,user_id,primary_program_id,features');
  if (holder) requireBinding(state.programHolder?.id && state.qaProgramId && holder.user_id === state.programHolder.id && holder.primary_program_id === state.qaProgramId &&
    holder.features?.qa_e2e === true && String(holder.features?.qa_run_id) === String(state.runId), 'holder');
  const link = await read('program_holder_programs', state.holderProgramId, 'id,program_holder_id,program_id');
  if (link) requireBinding(state.holderId && state.qaProgramId && link.program_holder_id === state.holderId && link.program_id === state.qaProgramId, 'holder program');
  const hvac = await read('program_enrollments', state.hvacEnrollmentId, 'id,user_id,student_id,course_id,source');
  if (hvac) requireBinding(state.learner?.id && hvac.user_id === state.learner.id && hvac.student_id === state.learner.id &&
    hvac.course_id === QA_HVAC_COURSE_ID && hvac.source === 'qa-e2e', 'HVAC enrollment');
  const enrollment = await read('program_enrollments', state.holderEnrollmentId, 'id,user_id,student_id,program_id,program_holder_id,source');
  if (enrollment) requireBinding(state.holderStudent?.id && state.qaProgramId && state.holderId && enrollment.user_id === state.holderStudent.id && enrollment.student_id === state.holderStudent.id &&
    enrollment.program_id === state.qaProgramId && enrollment.program_holder_id === state.holderId &&
    enrollment.source === 'qa-e2e', 'holder enrollment');

  const identities = [];
  for (const [key, kind, role] of [['learner', 'learner', 'student'], ['programHolder', 'program-holder', 'program_holder'], ['holderStudent', 'holder-student', 'student']]) {
    const fixture = state[key];
    if (!fixture) continue;
    const expectedEmail = `${state.marker}-${kind}@qa.invalid`;
    requireBinding(fixture.id && fixture.email === expectedEmail, `${kind} checkpoint`);
    const profile = await read('profiles', fixture.id, 'id,email,role,program_holder_id');
    const rosterEmail = `${state.marker}-holder-student@roster.qa.invalid`;
    if (profile) requireBinding(profile.role === role &&
      (profile.email === expectedEmail || (key === 'holderStudent' && profile.email === rosterEmail)) &&
      (key !== 'programHolder' || !profile.program_holder_id || profile.program_holder_id === state.holderId), `${kind} profile`);
    const { data, error } = await db.auth.admin.getUserById(fixture.id);
    if (error && !authMissing(error)) throw new Error(`QA cleanup read ${kind} Auth: ${error.message}`);
    const user = data?.user;
    if (user) requireBinding(user.id === fixture.id, `${kind} Auth ID`);
    if (user && !user.deleted_at) requireBinding(user.email === expectedEmail && user.app_metadata?.qa_e2e === true &&
      String(user.app_metadata?.qa_run_id) === String(state.runId) && user.app_metadata?.role === role, `${kind} Auth identity`);
    // Soft deletion may redact Auth metadata. Existing profile/enrollment/holder
    // bindings above remain verifiable; a fully removed identity needs no DML.
    const ownedRecord = profile || (key === 'learner' ? hvac : key === 'programHolder' ? holder : enrollment);
    identities.push({ key, fixture, profile, active: Boolean(user && !user.deleted_at), ownedRecord });
  }

  const learner = identities.find(identity => identity.key === 'learner');
  if (learner && (learner.active || learner.ownedRecord)) {
    for (const table of [
      'video_playback_events', 'learner_video_checkpoint_responses', 'interactive_video_quiz_answers',
      'learner_video_notes', 'learner_video_progress', 'checkpoint_scores', 'lesson_progress',
    ]) await checked(db.from(table).delete().eq('user_id', learner.fixture.id), `delete ${table}`);
    await checked(db.from('course_enrollments').delete().eq('student_id', learner.fixture.id), 'delete course enrollments');
  }
  if (hvac) await deleteOne(db.from('program_enrollments').delete().eq('id', hvac.id)
    .eq('user_id', state.learner.id).eq('student_id', state.learner.id)
    .eq('course_id', QA_HVAC_COURSE_ID).eq('source', 'qa-e2e'), 'HVAC enrollment');
  const reportQuery = remove => (remove ? db.from('program_holder_reports').delete() : db.from('program_holder_reports').select('id'))
    .eq('program_holder_id', state.holderId).eq('user_id', state.programHolder.id)
    .eq('report_type', 'student_progress').contains('metadata', { enrollment_id: state.holderEnrollmentId });
  const reportScope = state.holderEnrollmentId && state.programHolder?.id && state.holderId;
  if (reportScope && (enrollment || holder)) {
    await checked(reportQuery(true), 'delete holder reports');
  }
  if (enrollment) await deleteOne(db.from('program_enrollments').delete().eq('id', enrollment.id)
    .eq('user_id', state.holderStudent.id).eq('student_id', state.holderStudent.id)
    .eq('program_holder_id', state.holderId).eq('program_id', state.qaProgramId).eq('source', 'qa-e2e'), 'holder enrollment');
  if (link) await deleteOne(db.from('program_holder_programs').delete().eq('id', link.id)
    .eq('program_holder_id', state.holderId).eq('program_id', state.qaProgramId), 'holder program');
  const holderProfile = identities.find(identity => identity.key === 'programHolder')?.profile;
  if (holderProfile?.program_holder_id) await checked(db.from('profiles').update({ program_holder_id: null })
    .eq('id', state.programHolder.id).eq('program_holder_id', state.holderId), 'unlink holder profile');
  if (holder) await deleteOne(db.from('program_holders').delete().eq('id', holder.id)
    .eq('user_id', state.programHolder.id).eq('primary_program_id', state.qaProgramId)
    .contains('features', { qa_e2e: true, qa_run_id: state.runId }), 'holder');
  if (program) await deleteOne(db.from('programs').delete().eq('id', program.id)
    .eq('slug', `${state.marker}-program`).eq('category', 'qa'), 'program');
  for (const identity of identities) {
    if (identity.profile) await deleteOne(db.from('profiles').delete().eq('id', identity.fixture.id)
      .eq('role', identity.profile.role).eq('email', identity.profile.email), `${identity.key} profile`);
    if (identity.active) {
      const { error } = await db.auth.admin.deleteUser(identity.fixture.id, true);
      if (error && !authMissing(error)) throw new Error(`QA cleanup soft-delete ${identity.key} Auth: ${error.message}`);
    }
  }

  for (const [table, id] of [
    ['program_enrollments', state.hvacEnrollmentId], ['program_enrollments', state.holderEnrollmentId],
    ['program_holder_programs', state.holderProgramId], ['program_holders', state.holderId], ['programs', state.qaProgramId],
    ...identities.map(identity => ['profiles', identity.fixture.id]),
  ]) if (await read(table, id, 'id')) throw new Error(`QA cleanup incomplete: ${table}`);
  if (reportScope && (await checked(reportQuery(false), 'verify holder reports')).length)
    throw new Error('QA cleanup incomplete: holder reports');
  for (const identity of identities) {
    const { data, error } = await db.auth.admin.getUserById(identity.fixture.id);
    if (error && !authMissing(error)) throw new Error(`QA cleanup verify Auth: ${error.message}`);
    if (data?.user && !data.user.deleted_at) throw new Error('QA cleanup incomplete: Auth identity remains active');
  }
  console.log(JSON.stringify({ ok: true, cleanedRunId: state.runId }));
}

if (action === 'provision') await provision(); else if (action === 'cleanup') await cleanup(); else throw new Error(`Unknown action: ${action}`);
