import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createQaAuthUser } from './supabase-auth-fixtures.mjs';
import { writePrivateQaState } from './write-private-state.mjs';
import { assertQaApprenticeshipEnrollment, scopeQaHolderAssignmentAlert } from './qa-host-shop-alert-cleanup.mjs';

const action = process.argv[2] || 'provision';
const statePath = process.env.QA_E2E_STATE_PATH || '.qa-apprenticeship-e2e-state.json';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

const tenantId = '6ba71334-58f4-4104-9b2a-5114f2a7614c';
// Production disposables are the only mode that may touch the live
// project. In that mode the disposable enrollment must never be a paid
// enrollment (see the enrollment insert below): a paid row invites
// billing/reconciliation and RAPIDS side effects that cleanup cannot
// fully unwind. QA mode keeps the verified self-pay grant.
const isProductionDisposable = qaHostname === 'cuxzzpsyufcewtmicszk.supabase.co';
// The desktop-chrome workflow runs shards in parallel against the same QA
// project: QA_PORTAL_E2E_RUN_ID is per-shard (run-attempt-shard), while
// GITHUB_RUN_ID is shared, so a shared marker would collide on the
// disposable apprentice/host emails. The registered-apprenticeship workflow
// does not set QA_PORTAL_E2E_RUN_ID and keeps the GITHUB_RUN_ID marker.
const runId = String(process.env.QA_PORTAL_E2E_RUN_ID || process.env.GITHUB_RUN_ID || Date.now());
const marker = `qa-e2e-${runId}`;

function password() {
  return `Qa!${randomBytes(18).toString('base64url')}7z`;
}

const TRANSIENT_DATABASE_ERROR = /statement timeout|canceling statement|schema cache|fetch failed|connection reset|gateway timeout|temporarily unavailable/i;

async function must(resultPromise, label) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await resultPromise;
    if (!result.error) return result.data;

    const message = String(result.error.message || result.error);
    const retryable = TRANSIENT_DATABASE_ERROR.test(message);
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`${label}: ${message}`);
    }

    const delayMs = 1_500 * attempt;
    console.warn(`[QA fixture] ${label} hit a transient database error; retrying ${attempt}/${maxAttempts} in ${delayMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`${label}: exhausted retry policy`);
}

async function createQaUser(kind, role, fullName) {
  const email = `${marker}-${kind}@qa.invalid`;
  const pass = password();
  const user = await createQaAuthUser({
    db,
    email,
    password: pass,
    role,
    fullName,
    runId,
    label: `create ${kind} auth user`,
  });

  await must(
    db.from('profiles').upsert({
      id: user.id,
      email,
      full_name: fullName,
      role,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' }),
    `upsert ${kind} profile`,
  );
  return { id: user.id, email, password: pass };
}

async function provision() {
  let state = { runId, marker, host: null, apprentice: null, approver: null, partnerId: null, shopId: null, hostShopId: null, enrollmentId: null, placementId: null };

  try {
    const host = await createQaUser('host', 'host_shop', '[QA E2E] Host Shop Supervisor');
    state.host = host;
    // Persist every completed resource immediately so interrupted QA can clean it.
    await writePrivateQaState(statePath, state);
    const apprentice = await createQaUser('apprentice', 'apprentice', '[QA E2E] Barber Apprentice');
    state.apprentice = apprentice;
    // Persist every completed resource immediately so interrupted QA can clean it.
    await writePrivateQaState(statePath, state);

    // Production disposables are approved by a dedicated QA approver
    // identity created by this fixture — never by a real administrator.
    // The learner gate admits a waived enrollment only with a recorded
    // manual approval (approved_at + approved_by), so the approver must
    // exist before the enrollment is inserted. QA mode does not create
    // one: it keeps the verified self-pay grant and needs no approver.
    let approver = null;
    if (isProductionDisposable) {
      approver = await createQaUser('approver', 'admin', '[QA E2E] Approver');
      state.approver = approver;
      // Persist every completed resource immediately so interrupted QA can clean it.
      await writePrivateQaState(statePath, state);
    }

    const program = await must(
      db.from('programs').select('id,slug,organization_id,tenant_id').eq('slug', 'barber-apprenticeship').maybeSingle(),
      'load barber apprenticeship program',
    );
    if (!program?.id) throw new Error('Canonical barber-apprenticeship program is missing');

    const standard = await must(
      db.from('apprenticeship_standard_versions')
        .select('standard_key')
        .eq('program_slug', 'barber-apprenticeship')
        .eq('registration_number', '2025-IN-132301')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'load active Barber registered standard',
    );
    if (!standard?.standard_key) throw new Error('Active registered Barber standard is missing');

    const partner = await must(
      db.from('partners').insert({
        name: `[QA E2E] Host Shop ${runId}`,
        dba: `[QA E2E] Host Shop ${runId}`,
        legal_name: `[QA E2E] Host Shop ${runId}`,
        shop_name: `[QA E2E] Host Shop ${runId}`,
        owner_name: '[QA E2E] Host Shop Supervisor',
        contact_name: '[QA E2E] Host Shop Supervisor',
        contact_email: host.email,
        city: 'Indianapolis',
        state: 'IN',
        zip: '46201',
        status: 'active',
        is_active: true,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        verification_status: 'verified',
        verification_details: { qa_e2e: true, qa_run_id: runId },
        documents_verified: true,
        mou_signed: true,
        mou_signed_at: new Date().toISOString(),
        mou_acknowledged: true,
        onboarding_completed: true,
        onboarding_step: 'complete',
        partner_type: 'host_shop',
        type: 'host_shop',
        programs: ['barber-apprenticeship'],
        notes: `Disposable production QA fixture ${marker}`,
        rapids_registration_status: 'qa_test_fixture',
        rapids_sponsor_registration_number: '2025-IN-132301',
      }).select('id').single(),
      'create QA host-shop partner',
    );
    state.partnerId = partner.id;
    // Persist every completed resource immediately so interrupted QA can clean it.
    await writePrivateQaState(statePath, state);

    await must(
      db.from('partner_users').insert({
        user_id: host.id,
        partner_id: partner.id,
        role: 'supervisor',
        status: 'active',
        organization_id: program.organization_id,
      }),
      'create QA partner membership',
    );

    const shop = await must(
      db.from('shops').insert({
        name: `[QA E2E] Host Shop ${runId}`,
        address1: '100 QA Test Way',
        city: 'Indianapolis',
        state: 'IN',
        zip: '46201',
        email: host.email,
        active: true,
        tenant_id: program.tenant_id || tenantId,
        owner_id: host.id,
        partner_id: partner.id,
      }).select('id').single(),
      'create QA shop',
    );
    state.shopId = shop.id;
    // Persist every completed resource immediately so interrupted QA can clean it.
    await writePrivateQaState(statePath, state);

    const hostShop = await must(
      db.from('host_shops').insert({
        // Match requests FK to host_shops.id, whereas placement rosters use shops.id.
        // The two canonical records must share the exact ID for this QA fixture.
        id: shop.id,
        name: `[QA E2E] Host Shop ${runId}`,
        owner_id: host.id,
        tenant_id: program.tenant_id || tenantId,
        address: '100 QA Test Way', city: 'Indianapolis', state: 'IN', zip_code: '46201',
        email: host.email, owner_name: '[QA E2E] Host Shop Supervisor', owner_email: host.email,
        shop_status: 'active', approval_status: 'approved', is_approved: true, verified: true,
        is_accepting_apprentices: true,
      }).select('id').single(),
      'create canonical QA host_shop',
    );
    state.hostShopId = hostShop.id;
    // Persist every completed resource immediately so interrupted QA can clean it.
    await writePrivateQaState(statePath, state);

    await must(
      db.from('shop_staff').insert({
        shop_id: shop.id,
        user_id: host.id,
        role: 'supervisor',
        active: true,
        tenant_id: program.tenant_id || tenantId,
      }),
      'create QA shop supervisor assignment',
    );

    // The apprentice layout admits only enrollments that pass
    // hasApprovedPaidLearnerEnrollment (lib/learner/approved-paid-admission.mjs):
    // access_status active/granted + access_granted_at + (manual approval
    // OR verified self-pay with a payment reference) + a settled payment
    // status. The old row set access_granted_at but no access_status,
    // payment_status 'qa_test' (which the admission test explicitly lists
    // as non-admitting), and no approval or verification, so the
    // disposable apprentice landed on /lms/access-pending and no
    // apprentice surface could be certified (run 45266295624, shard 4/4).
    // Production disposables are WAIVED, never paid: a paid row carries a
    // synthetic payment_reference and self-pay verification, and invites
    // billing/reconciliation side effects that cleanup cannot fully
    // unwind. The gate admits 'waived' as a settled payment status, so
    // the production enrollment is waived + fixture-approved by the QA
    // approver identity created above (no payment reference, no self-pay
    // verification). QA mode keeps the verified self-pay grant so the
    // isolated-QA playback path is unchanged. A voucher (WIOA) shape was
    // rejected: it would fabricate a funding claim for a synthetic
    // enrollment and could trigger voucher-payout processing. The QA
    // marker survives on funding_pathway 'qa_e2e', draft_data and
    // source 'qa_e2e'.
    const productionPayment = {
      payment_status: 'waived',
      funding_status: 'waived',
      approved_at: new Date().toISOString(),
      approved_by: approver ? approver.id : null,
    };
    const qaPayment = {
      payment_status: 'paid',
      funding_status: 'unfunded_self_continuing',
      payment_reference: `qa-e2e-${runId}`,
      self_pay_application_verified_at: new Date().toISOString(),
    };
    const enrollmentPayment = isProductionDisposable ? productionPayment : qaPayment;
    const enrollment = await must(
      db.from('program_enrollments').insert({
        user_id: apprentice.id,
        student_id: apprentice.id,
        program_id: program.id,
        program_slug: program.slug,
        email: apprentice.email,
        full_name: '[QA E2E] Barber Apprentice',
        status: 'active',
        enrollment_state: 'active',
        enrollment_confirmed_at: new Date().toISOString(),
        enrolled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        access_granted_at: new Date().toISOString(),
        access_status: 'active',
        funding_source: 'SELF_PAY',
        funding_pathway: 'qa_e2e',
        ...enrollmentPayment,
        funding_verified: false,
        organization_id: program.organization_id,
        tenant_id: program.tenant_id || tenantId,
        source: 'qa_e2e',
        draft_data: { qa_e2e: true, qa_run_id: runId, disposable: true },
        host_shop_id: hostShop.id,
        host_shop_name: `[QA E2E] Host Shop ${runId}`,
        has_host_shop: true,
        supervisor_id: host.id,
        lms_enrolled: true,
        agreement_signed: false,
        intake_completed: true,
        next_required_action: 'QA_E2E_ONLY',
      }).select('id').single(),
      'create QA apprentice enrollment',
    );
    state.enrollmentId = enrollment.id;
    // Persist every completed resource immediately so interrupted QA can clean it.
    await writePrivateQaState(statePath, state);

    const placement = await must(
      db.from('apprentice_placements').insert({
        student_id: apprentice.id,
        program_slug: program.slug,
        shop_id: shop.id,
        supervisor_user_id: host.id,
        start_date: new Date().toISOString().slice(0, 10),
        status: 'active',
        tenant_id: program.tenant_id || tenantId,
      }).select('id').single(),
      'create QA apprentice placement',
    );
    state.placementId = placement.id;
    // Persist every completed resource immediately so interrupted QA can clean it.
    await writePrivateQaState(statePath, state);

    await writePrivateQaState(statePath, state);

    if (process.env.GITHUB_ENV) {
      const lines = [
        `E2E_HOST_SHOP_EMAIL=${host.email}`,
        `E2E_HOST_SHOP_PASSWORD=${host.password}`,
        `E2E_APPRENTICE_EMAIL=${apprentice.email}`,
        `E2E_APPRENTICE_PASSWORD=${apprentice.password}`,
      ];
      await writeFile(process.env.GITHUB_ENV, `${lines.join('\n')}\n`, { flag: 'a' });
      console.log(`::add-mask::${host.password}`);
      console.log(`::add-mask::${apprentice.password}`);
    }

    console.log(JSON.stringify({
      ok: true,
      runId,
      hostUserId: host.id,
      apprenticeUserId: apprentice.id,
      partnerId: partner.id,
      shopId: shop.id,
      enrollmentId: enrollment.id,
      placementId: placement.id,
      standardKey: standard.standard_key,
    }));
  } catch (error) {
    await writePrivateQaState(statePath, state).catch(() => {});
    await cleanup().catch((cleanupError) => console.error('cleanup after provision failure:', cleanupError));
    throw error;
  }
}

async function cleanup() {
  // A missing state file is not proof that a cancelled run left no fixtures.
  // Cleanup must not print success or suppress errors in that case.
  let state;
  try {
    state = JSON.parse(await readFile(statePath, 'utf8'));
  } catch {
    throw new Error('QA cleanup state missing: reconcile run-scoped fixtures before certifying teardown');
  }

  if (!state.runId || state.marker !== `qa-e2e-${state.runId}`) {
    throw new Error('QA cleanup state does not contain a valid exact-run marker');
  }

  const expectedEmail = (kind) => `${state.marker}-${kind}@qa.invalid`;
  for (const kind of ['host', 'apprentice', 'approver']) {
    if (state[kind] && (!state[kind].id || state[kind].email !== expectedEmail(kind))) {
      throw new Error(`QA cleanup rejected unexpected ${kind} identity`);
    }
  }

  const checked = async (promise, label) => {
    const { data, error } = await promise;
    if (error) throw new Error(`QA cleanup ${label}: ${error.message}`);
    return data;
  };
  // Derived tables may not exist in the isolated QA project (minimal
  // schema: 58 migrations vs production's 1515). A missing table means
  // no derived rows could have been created there, so "table does not
  // exist" is ignored; every other error still fails cleanup.
  const isMissingTableError = (error) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    return code === 'PGRST205' || /could not find the table|relation .* does not exist|42P01/i.test(message);
  };
  const deleteDerived = async (promise, label) => {
    const { error } = await promise;
    if (error && !isMissingTableError(error)) throw new Error(`QA cleanup ${label}: ${error.message}`);
  };
  const assertDerivedGone = async (promise, label) => {
    const { data, error } = await promise;
    if (error) {
      if (isMissingTableError(error)) return;
      throw new Error(`QA cleanup verify ${label}: ${error.message}`);
    }
    if ((data || []).length) throw new Error(`QA cleanup incomplete: ${label}`);
  };
  const { enrollmentId, placementId, shopId, hostShopId, partnerId } = state;
  const hostId = state.host?.id;
  const apprenticeId = state.apprentice?.id;
  const approverId = state.approver?.id;
  // Attest the enrollment itself before any destructive action, even when
  // the checkpoint contains a valid disposable profile.
  if (enrollmentId) {
    const enrollment = await checked(db.from('program_enrollments')
      .select('id,user_id,student_id,email,source,draft_data').eq('id', enrollmentId).maybeSingle(), 'load fixture enrollment');
    assertQaApprenticeshipEnrollment(state, enrollment);
  }
  // Fail BEFORE any destructive action if this fixture gained regulated records.
  if (placementId) {
    const placement = await checked(db.from('apprentice_placements')
      .select('id,shop_id,student_id').eq('id', placementId).maybeSingle(), 'load placement');
    if (placement && (placement.shop_id !== shopId || placement.student_id !== apprenticeId)) {
      throw new Error('QA cleanup placement ownership mismatch');
    }
    for (const [table, column] of [
      ['host_shop_attendance_records', 'placement_id'],
      ['apprenticeship_wage_obligations', 'placement_id'],
    ]) {
      const records = await checked(db.from(table).select('id').eq(column, placementId).limit(1),
        `check ${table} retention dependencies`);
      if (records.length) throw new Error(`QA cleanup retention review required: ${table}`);
    }
  }
  if (shopId) {
    const shop = await checked(db.from('shops').select('id,name').eq('id', shopId).maybeSingle(), 'load shop');
    if (shop && shop.name !== `[QA E2E] Host Shop ${state.runId}`) {
      throw new Error('QA cleanup rejected non-fixture shop');
    }
  }
  // Host shop has the exact same ID as shops. The insert may have committed
  // before the second checkpoint was saved during a cancelled runner.
  const recoveredHostShopId = hostShopId || shopId;
  if (hostShopId && shopId && hostShopId !== shopId) {
    throw new Error('QA cleanup host shop checkpoint disagrees with canonical shop ID');
  }
  if (recoveredHostShopId) {
    const hostShop = await checked(db.from('host_shops')
      .select('id,name,owner_id').eq('id', recoveredHostShopId).maybeSingle(), 'load host shop');
    if (hostShop && (hostShop.name !== `[QA E2E] Host Shop ${state.runId}`
      || hostShop.owner_id !== hostId)) {
      throw new Error('QA cleanup rejected non-fixture host shop');
    }
  }
  if (partnerId) {
    const partner = await checked(db.from('partners').select('id,name').eq('id', partnerId).maybeSingle(), 'load partner');
    if (partner && partner.name !== `[QA E2E] Host Shop ${state.runId}`) {
      throw new Error('QA cleanup rejected non-fixture partner');
    }
  }
  for (const [userId, kind] of [[hostId, 'host'], [apprenticeId, 'apprentice'], [approverId, 'approver']]) {
    if (!userId) continue;
    const profile = await checked(db.from('profiles').select('id,email').eq('id', userId).maybeSingle(),
      `load ${kind} profile`);
    if (profile && profile.email !== expectedEmail(kind)) throw new Error('QA cleanup rejected non-fixture profile');
  }

  // Derived rows created by database triggers on the active enrollment
  // insert. program_holder_students and course_enrollments reference the
  // enrollment and are removed BEFORE it; the outbox/queue/event rows
  // below reference it only by id/payload and are removed AFTER it.
  if (enrollmentId) await deleteDerived(db.from('program_holder_students')
    .delete().eq('enrollment_id', enrollmentId), 'delete holder-student link');
  if (apprenticeId) await deleteDerived(db.from('course_enrollments')
    .delete().eq('student_id', apprenticeId), 'delete mirrored course enrollments');
  if (enrollmentId) await checked(db.from('apprentice_competency_records')
    .delete().eq('enrollment_id', enrollmentId), 'delete competency records');
  if (placementId) await checked(db.from('apprentice_placements').delete().eq('id', placementId), 'delete placement');
  if (enrollmentId) await checked(db.from('program_enrollments').delete().eq('id', enrollmentId), 'delete enrollment');
  if (enrollmentId) {
    // Trigger-derived outbox and queue rows. The RAPIDS queue entry, the
    // staff notification, the welcome email and the platform event are
    // created for ANY active apprenticeship enrollment (not only paid
    // ones), so they must be removed even in the waived production path.
    // The enrollment_insert_audit row is intentionally retained: it is an
    // append-only audit trail of the fixture insert, not a billing or
    // lifecycle record.
    await deleteDerived(db.from('rapids_action_queue').delete()
      .eq('entity_type', 'apprentice').eq('entity_id', enrollmentId)
      .eq('action_type', 'register_apprentice'), 'delete RAPIDS queue entry');
    await deleteDerived(db.from('staff_notifications').delete()
      .eq('type', 'apprentice_ready_for_rapids')
      .eq('metadata->>enrollment_id', enrollmentId), 'delete RAPIDS staff notification');
    // Backstop the deployed QA-alert trigger guard. Scope by both fixture
    // identities, never by the actual holder receiving the notification.
    const holderAlertDelete = scopeQaHolderAssignmentAlert(db.from('notifications').delete(), enrollmentId, apprenticeId);
    if (isProductionDisposable) await checked(holderAlertDelete, 'delete fixture holder assignment alert');
    else await deleteDerived(holderAlertDelete, 'delete fixture holder assignment alert');
    await deleteDerived(db.from('notification_outbox').delete()
      .eq('template_key', 'enrollment_welcome').eq('entity_type', 'program_enrollment')
      .eq('entity_id', enrollmentId), 'delete welcome outbox entry');
    await deleteDerived(db.from('platform_events').delete()
      .eq('event_type', 'enrollment.confirmed').eq('subject_type', 'program_enrollment')
      .eq('subject_id', enrollmentId), 'delete enrollment platform event');
  }
  if (shopId) await checked(db.from('shop_staff').delete().eq('shop_id', shopId), 'delete shop staff');
  if (hostId && partnerId) await checked(db.from('partner_users').delete()
    .eq('user_id', hostId).eq('partner_id', partnerId), 'delete partner membership');
  if (shopId) await checked(db.from('shops').delete().eq('id', shopId), 'delete shop');
  if (recoveredHostShopId) await checked(db.from('host_shops').delete().eq('id', recoveredHostShopId), 'delete host shop');
  if (partnerId) await checked(db.from('partners').delete().eq('id', partnerId), 'delete partner');

  // The approver is removed after the enrollment it approved, so the
  // approval foreign key stays valid until the enrollment is gone.
  for (const [userId, kind] of [[apprenticeId, 'apprentice'], [hostId, 'host'], [approverId, 'approver']]) {
    if (!userId) continue;
    await checked(db.from('profiles').delete().eq('id', userId), `delete ${kind} profile`);
    const { error } = await db.auth.admin.deleteUser(userId, true);
    if (error && !/not found/i.test(error.message)) {
      throw new Error(`QA cleanup soft-delete auth ${kind}: ${error.message}`);
    }
  }

  for (const [table, id] of [
    ['apprentice_placements', placementId],
    ['program_enrollments', enrollmentId],
    ['shops', shopId],
    ['host_shops', recoveredHostShopId],
    ['partners', partnerId],
  ]) {
    if (!id) continue;
    const remaining = await checked(db.from(table).select('id').eq('id', id).limit(1),
      `verify ${table} teardown`);
    if (remaining.length) throw new Error(`QA cleanup incomplete: ${table}`);
  }
  for (const userId of [apprenticeId, hostId, approverId].filter(Boolean)) {
    const remaining = await checked(db.from('profiles').select('id').eq('id', userId).limit(1),
      'verify profile teardown');
    if (remaining.length) throw new Error('QA cleanup incomplete: profile');
    const { data, error } = await db.auth.admin.getUserById(userId);
    if (error && !/not found/i.test(error.message)) throw new Error(`QA Auth readback: ${error.message}`);
    if (data?.user && !data.user.deleted_at) throw new Error('QA Auth identity remains active');
  }
  // Verify the trigger-derived rows are gone (skipped where the table
  // does not exist in the QA project).
  if (apprenticeId) await assertDerivedGone(db.from('course_enrollments')
    .select('id').eq('student_id', apprenticeId).limit(1), 'course enrollments');
  if (enrollmentId) {
    await assertDerivedGone(db.from('program_holder_students')
      .select('id').eq('enrollment_id', enrollmentId).limit(1), 'holder-student link');
    await assertDerivedGone(db.from('rapids_action_queue')
      .select('id').eq('entity_type', 'apprentice').eq('entity_id', enrollmentId)
      .eq('action_type', 'register_apprentice').limit(1), 'RAPIDS queue entry');
    await assertDerivedGone(db.from('staff_notifications')
      .select('id').eq('type', 'apprentice_ready_for_rapids')
      .eq('metadata->>enrollment_id', enrollmentId).limit(1), 'RAPIDS staff notification');
    const holderAlertReadback = scopeQaHolderAssignmentAlert(db.from('notifications').select('id'), enrollmentId, apprenticeId).limit(1);
    if (isProductionDisposable) {
      const remaining = await checked(holderAlertReadback, 'verify fixture holder assignment alert');
      if (remaining.length) throw new Error('QA cleanup incomplete: fixture holder assignment alert');
    } else await assertDerivedGone(holderAlertReadback, 'fixture holder assignment alert');
    await assertDerivedGone(db.from('notification_outbox')
      .select('id').eq('template_key', 'enrollment_welcome')
      .eq('entity_type', 'program_enrollment').eq('entity_id', enrollmentId).limit(1), 'welcome outbox entry');
    await assertDerivedGone(db.from('platform_events')
      .select('id').eq('event_type', 'enrollment.confirmed')
      .eq('subject_type', 'program_enrollment').eq('subject_id', enrollmentId).limit(1), 'enrollment platform event');
  }
  console.log(JSON.stringify({ ok: true, cleanedRunId: state.runId }));
}

if (action === 'provision') await provision();
else if (action === 'cleanup') await cleanup();
else throw new Error(`Unknown action: ${action}`);
