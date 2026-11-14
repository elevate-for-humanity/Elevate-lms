import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomUUID } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { readFile, writeFile } from 'node:fs/promises';
import { createQaAuthUser } from './supabase-auth-fixtures.mjs';
import { writePrivateQaState } from './write-private-state.mjs';

const action = process.argv[2] || 'provision';
const statePath =
  process.env.QA_REMAINING_PORTAL_E2E_STATE_PATH || '.qa-remaining-portal-e2e-state.json';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase QA credentials are required');

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const runId = String(process.env.GITHUB_RUN_ID || Date.now());
const marker = `qa-portal-e2e-${runId}`;
const roles = [
  ['employer', 'employer', 'Employer'],
  ['instructor', 'instructor', 'Instructor'],
  ['staff', 'staff', 'Staff'],
  ['case-manager', 'case_manager', 'Case Manager'],
  ['admin', 'admin', 'Admin'],
];

function password() {
  return `Qa!${randomBytes(18).toString('base64url')}9x`;
}

async function provision() {
  const anchorResult = await db
    .from('programs')
    .select('tenant_id')
    .eq('slug', 'barber-apprenticeship')
    .maybeSingle();
  if (anchorResult.error || !anchorResult.data?.tenant_id)
    throw new Error(
      `Tenant anchor unavailable: ${anchorResult.error?.message || 'missing tenant'}`,
    );
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
      const profile = await db.from('profiles').upsert(
        {
          id: user.id,
          email,
          full_name: `[QA E2E] ${label}`,
          role,
          tenant_id: tenantId,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (profile.error) throw new Error(`profile ${kind}: ${profile.error.message}`);
      const fixture = { id: user.id, kind, role, email, password: pass };
      state.users.push(fixture);
      if (kind === 'employer') {
        fixture.employerId = randomUUID();
        fixture.documentId = randomUUID();
        fixture.objectPath = `${user.id}/qa/${runId}.pdf`;
        const employer = await db
          .from('employers')
          .insert({
            id: fixture.employerId,
            owner_user_id: user.id,
            company_name: `[QA E2E] ${marker}`,
            business_name: `[QA E2E] ${marker}`,
            contact_name: 'QA Employer',
            email,
            status: 'pending',
            approved: false,
            notes: `Disposable employer workflow fixture ${marker}`,
          });
        if (employer.error) throw new Error(`employer fixture: ${employer.error.message}`);
        const onboarding = await db
          .from('employer_onboarding')
          .insert({
            employer_id: fixture.employerId,
            status: 'onboarding_in_progress',
            notes: `Disposable fixture ${marker}`,
          });
        if (onboarding.error)
          throw new Error(`employer onboarding fixture: ${onboarding.error.message}`);
        const pdf = await PDFDocument.create();
        pdf.addPage().drawText(`QA employer document ${marker}`, { x: 40, y: 700, size: 12 });
        const file = await db.storage
          .from('documents')
          .upload(fixture.objectPath, Buffer.from(await pdf.save()), {
            contentType: 'application/pdf',
            upsert: false,
          });
        if (file.error) throw new Error(`employer document fixture: ${file.error.message}`);
        const document = await db
          .from('documents')
          .insert({
            id: fixture.documentId,
            user_id: user.id,
            owner_type: 'employer',
            owner_id: fixture.employerId,
            file_name: 'QA-employer-onboarding.pdf',
            file_path: fixture.objectPath,
            storage_path: fixture.objectPath,
            file_url: null,
            mime_type: 'application/pdf',
            document_type: 'other',
            status: 'pending',
            metadata: {
              storage_bucket: 'documents',
              storage_path: fixture.objectPath,
              qa_run_id: runId,
            },
          });
        if (document.error)
          throw new Error(`employer document record fixture: ${document.error.message}`);
      }
    }
    await writePrivateQaState(statePath, state);
    if (process.env.GITHUB_ENV) {
      const envNames = {
        employer: 'EMPLOYER',
        instructor: 'INSTRUCTOR',
        staff: 'STAFF',
        'case-manager': 'CASE_MANAGER',
        admin: 'ADMIN',
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
    await writePrivateQaState(statePath, state).catch(() => {});
    await cleanup().catch(() => {});
    throw error;
  }
}

async function cleanup() {
  let state;
  try {
    state = JSON.parse(await readFile(statePath, 'utf8'));
  } catch {
    console.log('No remaining portal QA state file found; nothing to clean.');
    return;
  }
  for (const user of state.users || []) {
    if (user.kind === 'employer') {
      if (user.documentId)
        await db.from('documents').delete().eq('id', user.documentId).eq('user_id', user.id);
      if (user.objectPath) await db.storage.from('documents').remove([user.objectPath]);
      if (user.employerId) {
        await db
          .from('employer_onboarding_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('employer_id', user.employerId);
        await db.from('employer_onboarding').delete().eq('employer_id', user.employerId);
        await db.from('employers').delete().eq('id', user.employerId).eq('owner_user_id', user.id);
      }
    }
    await db.from('profiles').delete().eq('id', user.id);
    const removed = await db.auth.admin.deleteUser(user.id, true);
    if (removed.error && !/not found/i.test(removed.error.message))
      console.error(`soft-delete ${user.kind}: ${removed.error.message}`);
  }
  console.log(JSON.stringify({ ok: true, cleanedRunId: state.runId }));
}

if (action === 'provision') await provision();
else if (action === 'cleanup') await cleanup();
else throw new Error(`Unknown action: ${action}`);
