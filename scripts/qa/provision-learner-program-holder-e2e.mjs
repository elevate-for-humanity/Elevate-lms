import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createQaAuthUser } from './supabase-auth-fixtures.mjs';

const action = process.argv[2] || 'provision';
const statePath = process.env.QA_PORTAL_E2E_STATE_PATH || '.qa-learner-program-holder-e2e-state.json';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const runId = String(process.env.GITHUB_RUN_ID || Date.now());
const marker = `qa-portal-e2e-${runId}`;

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
  let state = { runId, marker, learner: null, programHolder: null, qaProgramId: null, holderId: null, holderProgramId: null };
  try {
    const learner = await createQaUser('learner', 'student', '[QA E2E] Learner', anchor.tenant_id); state.learner = learner;
    const programHolder = await createQaUser('program-holder', 'program_holder', '[QA E2E] Program Holder', anchor.tenant_id); state.programHolder = programHolder;
    const qaProgram = await must(db.from('programs').insert({ slug: `${marker}-program`, title: '[QA E2E] Isolated Program Holder Program', name: '[QA E2E] Isolated Program Holder Program', category: 'qa', description: 'Disposable isolated program used only for responsive production QA.', is_active: false, published: false, status: 'draft', review_status: 'draft', tenant_id: anchor.tenant_id, organization_id: anchor.organization_id, funding_eligible: false, is_free: true, enrollment_state: 'closed' }).select('id,slug').single(), 'create isolated QA program'); state.qaProgramId = qaProgram.id;
    const holder = await must(db.from('program_holders').insert({ user_id: programHolder.id, organization_name: '[QA E2E] Isolated Program Holder', name: '[QA E2E] Program Holder', contact_name: '[QA E2E] Program Holder', contact_email: programHolder.email, status: 'approved', approved_at: new Date().toISOString(), mou_signed: true, mou_signed_at: new Date().toISOString(), mou_status: 'signed', is_using_internal_lms: true, payout_status: 'not_started', primary_program_id: qaProgram.id, teaches_multiple: false, features: { qa_e2e: true, qa_run_id: runId, isolated: true } }).select('id').single(), 'create isolated QA program holder'); state.holderId = holder.id;
    await must(db.from('profiles').update({ program_holder_id: holder.id }).eq('id', programHolder.id), 'link QA profile to program holder');
    const holderProgram = await must(db.from('program_holder_programs').insert({ program_holder_id: holder.id, program_id: qaProgram.id, program_slug: qaProgram.slug, role_in_program: 'owner', is_primary: true, status: 'active' }).select('id').single(), 'associate isolated QA program'); state.holderProgramId = holderProgram.id;
    await writeFile(statePath, JSON.stringify(state, null, 2));
    if (process.env.GITHUB_ENV) {
      await writeFile(process.env.GITHUB_ENV, [`E2E_LEARNER_EMAIL=${learner.email}`, `E2E_LEARNER_PASSWORD=${learner.password}`, `E2E_PROGRAM_HOLDER_EMAIL=${programHolder.email}`, `E2E_PROGRAM_HOLDER_PASSWORD=${programHolder.password}`].join('\n') + '\n', { flag: 'a' });
      console.log(`::add-mask::${learner.password}`); console.log(`::add-mask::${programHolder.password}`);
    }
    console.log(JSON.stringify({ ok: true, learnerUserId: learner.id, programHolderUserId: programHolder.id, holderId: holder.id, qaProgramId: qaProgram.id }));
  } catch (error) { await writeFile(statePath, JSON.stringify(state, null, 2)).catch(() => {}); await cleanup().catch((cleanupError) => console.error('cleanup after provision failure:', cleanupError)); throw error; }
}

async function cleanup() {
  let state; try { state = JSON.parse(await readFile(statePath, 'utf8')); } catch { console.log('No Learner/Program Holder QA state file found; nothing to clean up.'); return; }
  if (state.holderProgramId) await db.from('program_holder_programs').delete().eq('id', state.holderProgramId);
  if (state.holderId) await db.from('program_holders').delete().eq('id', state.holderId);
  if (state.qaProgramId) await db.from('programs').delete().eq('id', state.qaProgramId);
  for (const userId of [state.learner?.id, state.programHolder?.id].filter(Boolean)) {
    await db.from('profiles').delete().eq('id', userId);
    const { error } = await db.auth.admin.deleteUser(userId, true);
    if (error && !/not found/i.test(error.message)) console.error(`soft-delete auth user ${userId}: ${error.message}`);
  }
  console.log(JSON.stringify({ ok: true, cleanedRunId: state.runId }));
}

if (action === 'provision') await provision(); else if (action === 'cleanup') await cleanup(); else throw new Error(`Unknown action: ${action}`);
