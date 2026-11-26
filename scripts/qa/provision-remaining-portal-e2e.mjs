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

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const runId = String(process.env.QA_PORTAL_E2E_RUN_ID || process.env.GITHUB_RUN_ID || Date.now());
const marker = `qa-portal-e2e-${runId}`;
const roles = [
  ['admin', 'admin', 'Admin'],
  ['employer', 'employer', 'Employer'],
  ['instructor', 'instructor', 'Instructor'],
  ['staff', 'staff', 'Staff'],
  ['case-manager', 'case_manager', 'Case Manager'],
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
      if (kind === 'case-manager') {
        fixture.applicationId = randomUUID();
        const program = await db
          .from('programs')
          .select('id,slug')
          .eq('slug', 'hvac-technician')
          .maybeSingle();
        if (program.error || !program.data?.id)
          throw new Error(`case manager program fixture: ${program.error?.message || 'missing HVAC program'}`);
        const manager = await db.from('case_managers').insert({
          id: user.id,
          name: '[QA E2E] Case Manager',
          agency: '[QA E2E] Isolated Agency',
          email,
        });
        if (manager.error) throw new Error(`case manager fixture: ${manager.error.message}`);
        const application = await db.from('applications').insert({
          id: fixture.applicationId,
          first_name: 'QA',
          last_name: 'Participant',
          phone: '317-555-0199',
          email: `${marker}-participant@qa.invalid`,
          city: 'Indianapolis',
          zip: '46204',
          program_interest: 'HVAC Technician',
          program_id: program.data.id,
          program_slug: program.data.slug,
          has_case_manager: true,
          case_manager_agency: '[QA E2E] Isolated Agency',
          contact_preference: 'email',
          status: 'submitted',
        });
        if (application.error)
          throw new Error(`case manager application fixture: ${application.error.message}`);
        const assignment = await db.from('case_manager_assignments').insert({
          application_id: fixture.applicationId,
          case_manager_id: user.id,
        });
        if (assignment.error)
          throw new Error(`case manager assignment fixture: ${assignment.error.message}`);
      }
    }
    await writePrivateQaState(statePath, state);
    if (process.env.GITHUB_ENV) {
      const envNames = {
        admin: 'ADMIN',
        employer: 'EMPLOYER',
        instructor: 'INSTRUCTOR',
        staff: 'STAFF',
        'case-manager': 'CASE_MANAGER',
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
    if (user.kind === 'case-manager') {
      const assignments = await db.from('case_manager_assignments').delete().eq('case_manager_id', user.id);
      if (assignments.error)
        throw new Error(`case manager assignment cleanup: ${assignments.error.message}`);
      if (user.applicationId) {
        const application = await db.from('applications').delete().eq('id', user.applicationId);
        if (application.error)
          throw new Error(`case manager application cleanup: ${application.error.message}`);
        // The submitted application enqueues a platform event; remove it
        // so no downstream consumer acts on a disposable application.
        await deleteDerived(db.from('platform_events').delete()
          .eq('event_type', 'application.submitted').eq('subject_type', 'application')
          .eq('subject_id', user.applicationId), 'delete application platform event');
        await assertDerivedGone(db.from('platform_events').select('id')
          .eq('event_type', 'application.submitted').eq('subject_type', 'application')
          .eq('subject_id', user.applicationId).limit(1), 'application platform event');
      }
      const manager = await db.from('case_managers').delete().eq('id', user.id);
      if (manager.error)
        throw new Error(`case manager cleanup: ${manager.error.message}`);
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
