import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createQaAuthUser } from './supabase-auth-fixtures.mjs';

const action = process.argv[2] || 'provision';
const statePath = process.env.QA_REMAINING_PORTAL_E2E_STATE_PATH || '.qa-remaining-portal-e2e-state.json';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase QA credentials are required');

const db = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const runId = String(process.env.GITHUB_RUN_ID || Date.now());
const marker = `qa-portal-e2e-${runId}`;
const roles = [
  ['employer', 'employer', 'Employer'],
  ['instructor', 'instructor', 'Instructor'],
  ['staff', 'staff', 'Staff'],
  ['case-manager', 'case_manager', 'Case Manager'],
  ['admin', 'admin', 'Admin'],
];

function password() { return `Qa!${randomBytes(18).toString('base64url')}9x`; }

async function provision() {
  const anchorResult = await db.from('programs').select('tenant_id').eq('slug', 'barber-apprenticeship').maybeSingle();
  if (anchorResult.error || !anchorResult.data?.tenant_id) throw new Error(`Tenant anchor unavailable: ${anchorResult.error?.message || 'missing tenant'}`);
  const tenantId = anchorResult.data.tenant_id;
  const state = { runId, users: [] };
  try {
    for (const [kind, role, label] of roles) {
      const email = `${marker}-${kind}@qa.invalid`;
      const pass = password();
      const user = await createQaAuthUser({
        db,
        email,
        password: pass,
        role,
        fullName: `[QA E2E] ${label}`,
        runId,
        label: `create ${kind} auth user`,
      });
      const profile = await db.from('profiles').upsert({
        id: user.id,
        email,
        full_name: `[QA E2E] ${label}`,
        role,
        tenant_id: tenantId,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (profile.error) throw new Error(`profile ${kind}: ${profile.error.message}`);
      state.users.push({ id: user.id, kind, role, email, password: pass });
    }
    await writeFile(statePath, JSON.stringify(state, null, 2));
    if (process.env.GITHUB_ENV) {
      const envNames = {
        employer: 'EMPLOYER', instructor: 'INSTRUCTOR', staff: 'STAFF',
        'case-manager': 'CASE_MANAGER', admin: 'ADMIN',
      };
      const lines = [];
      for (const user of state.users) {
        const prefix = envNames[user.kind];
        lines.push(`E2E_${prefix}_EMAIL=${user.email}`);
        lines.push(`E2E_${prefix}_PASSWORD=${user.password}`);
        console.log(`::add-mask::${user.password}`);
      }
      await writeFile(process.env.GITHUB_ENV, `${lines.join('\n')}\n`, { flag: 'a' });
    }
    console.log(JSON.stringify({ ok: true, roles: state.users.map(({ role }) => role) }));
  } catch (error) {
    await writeFile(statePath, JSON.stringify(state, null, 2)).catch(() => {});
    await cleanup().catch(() => {});
    throw error;
  }
}

async function cleanup() {
  let state;
  try { state = JSON.parse(await readFile(statePath, 'utf8')); }
  catch { console.log('No remaining portal QA state file found; nothing to clean.'); return; }
  for (const user of state.users || []) {
    await db.from('profiles').delete().eq('id', user.id);
    const removed = await db.auth.admin.deleteUser(user.id, true);
    if (removed.error && !/not found/i.test(removed.error.message)) console.error(`soft-delete ${user.kind}: ${removed.error.message}`);
  }
  console.log(JSON.stringify({ ok: true, cleanedRunId: state.runId }));
}

if (action === 'provision') await provision();
else if (action === 'cleanup') await cleanup();
else throw new Error(`Unknown action: ${action}`);
