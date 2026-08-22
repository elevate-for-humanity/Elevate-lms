import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

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

const tenantId = '6ba71334-58f4-4104-9b2a-5114f2a7614c';
const runId = String(process.env.GITHUB_RUN_ID || Date.now());
const marker = `qa-e2e-${runId}`;

function password() {
  return `Qa!${randomBytes(18).toString('base64url')}7z`;
}

async function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function createQaUser(kind, role, fullName) {
  const email = `${marker}-${kind}@qa.invalid`;
  const pass = password();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: pass,
    email_confirm: true,
    app_metadata: { qa_e2e: true, qa_run_id: runId, role },
    user_metadata: { qa_e2e: true, qa_run_id: runId, full_name: fullName },
  });
  if (error || !data.user) throw new Error(`create ${kind} auth user: ${error?.message || 'no user returned'}`);

  await must(
    db.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' }),
    `upsert ${kind} profile`,
  );
  return { id: data.user.id, email, password: pass };
}

async function provision() {
  const host = await createQaUser('host', 'host_shop', '[QA E2E] Host Shop Supervisor');
  let apprentice;
  let state = { runId, marker, host, apprentice: null, partnerId: null, shopId: null, enrollmentId: null, placementId: null };

  try {
    apprentice = await createQaUser('apprentice', 'apprentice', '[QA E2E] Barber Apprentice');
    state.apprentice = apprentice;

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
        funding_source: 'SELF_PAY',
        funding_pathway: 'qa_e2e',
        funding_status: 'self_pay',
        payment_status: 'qa_test',
        funding_verified: false,
        organization_id: program.organization_id,
        tenant_id: program.tenant_id || tenantId,
        source: 'qa_e2e',
        draft_data: { qa_e2e: true, qa_run_id: runId, disposable: true },
        host_shop_id: partner.id,
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

    await writeFile(statePath, JSON.stringify(state, null, 2));

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
    await writeFile(statePath, JSON.stringify(state, null, 2)).catch(() => {});
    await cleanup().catch((cleanupError) => console.error('cleanup after provision failure:', cleanupError));
    throw error;
  }
}

async function cleanup() {
  let state;
  try {
    state = JSON.parse(await readFile(statePath, 'utf8'));
  } catch {
    console.log('No QA E2E state file found; nothing to clean up.');
    return;
  }

  const enrollmentId = state.enrollmentId;
  const placementId = state.placementId;
  const shopId = state.shopId;
  const partnerId = state.partnerId;
  const hostId = state.host?.id;
  const apprenticeId = state.apprentice?.id;

  if (enrollmentId) {
    await db.from('apprentice_competency_records').delete().eq('enrollment_id', enrollmentId);
  }
  if (placementId) await db.from('apprentice_placements').delete().eq('id', placementId);
  if (enrollmentId) await db.from('program_enrollments').delete().eq('id', enrollmentId);
  if (shopId) await db.from('shop_staff').delete().eq('shop_id', shopId);
  if (hostId && partnerId) await db.from('partner_users').delete().eq('user_id', hostId).eq('partner_id', partnerId);
  if (shopId) await db.from('shops').delete().eq('id', shopId);
  if (partnerId) await db.from('partners').delete().eq('id', partnerId);

  for (const userId of [apprenticeId, hostId].filter(Boolean)) {
    await db.from('profiles').delete().eq('id', userId);
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error && !/not found/i.test(error.message)) console.error(`delete auth user ${userId}: ${error.message}`);
  }

  console.log(JSON.stringify({ ok: true, cleanedRunId: state.runId }));
}

if (action === 'provision') await provision();
else if (action === 'cleanup') await cleanup();
else throw new Error(`Unknown action: ${action}`);
