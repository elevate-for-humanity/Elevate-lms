import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { randomBytes, randomUUID } from 'node:crypto';

// Administrative fixture provisioning only. Never run against production.
const { QA_PROJECT_REF, QA_SERVICE_KEY_FILE, QA_PERSONAS_FILE, QA_SDK_PACKAGE_JSON } = process.env;
if (!QA_PROJECT_REF || !QA_SERVICE_KEY_FILE || !QA_PERSONAS_FILE || !QA_SDK_PACKAGE_JSON) {
  throw new Error('Explicit QA project, key file, credential output and SDK location are required.');
}
if (QA_PROJECT_REF === 'cuxzzpsyufcewtmicszk' || !/^[a-z]{20}$/.test(QA_PROJECT_REF)) {
  throw new Error('Refusing invalid or production QA project.');
}
const key = (await readFile(QA_SERVICE_KEY_FILE, 'utf8')).trim();
const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
if (claims.ref !== QA_PROJECT_REF || claims.role !== 'service_role') {
  throw new Error('QA service key must belong to the explicitly selected QA project.');
}
const require = createRequire(QA_SDK_PACKAGE_JSON);
const { createClient } = require('@supabase/supabase-js');
const db = createClient(`https://${QA_PROJECT_REF}.supabase.co`, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const roles = {
  ADMIN: 'admin', LEARNER: 'student', PROGRAM_HOLDER: 'program_holder',
  HOST_SHOP: 'host_shop', APPRENTICE: 'apprentice', EMPLOYER: 'employer',
  INSTRUCTOR: 'instructor', STAFF: 'staff', CASE_MANAGER: 'case_manager',
};
let file;
try { file = JSON.parse(await readFile(QA_PERSONAS_FILE, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (file && file.project_ref !== QA_PROJECT_REF) throw new Error('Credential output belongs to another project.');
file ??= { project_ref: QA_PROJECT_REF, run_id: `qa-bootstrap-${new Date().toISOString()}`, personas: [] };
const save = async () => {
  const temporaryPath = `${QA_PERSONAS_FILE}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(file, null, 2), { mode: 0o600, flag: 'wx' });
    await rename(temporaryPath, QA_PERSONAS_FILE);
  } finally {
    await unlink(temporaryPath).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
};
for (const [name, role] of Object.entries(roles)) {
  let entry = file.personas.find(item => item.name === name);
  if (!entry) {
    entry = { name, role, email: `e2e-${name.toLowerCase().replaceAll('_', '-')}-${QA_PROJECT_REF}@example.invalid`, password: randomBytes(36).toString('base64url') };
    file.personas.push(entry);
    await save();
  }
  if (!entry.user_id) {
    // Always recover a request whose response was lost before creating another.
    const pageSize = 1000;
    let match;
    for (let page = 1; ; page++) {
      const existing = await db.auth.admin.listUsers({ page, perPage: pageSize });
      if (existing.error) throw new Error(`QA Auth lookup failed: ${existing.error.status || 'unknown'}`);
      match = existing.data.users.find(user => user.email === entry.email);
      if (match || existing.data.users.length < pageSize) break;
    }
    if (match) {
      if (match.app_metadata?.qa_run_id !== file.run_id || match.app_metadata?.role !== role) {
        throw new Error('Refusing to adopt an identity not owned by this QA run.');
      }
      entry.user_id = match.id;
    } else {
      const { data, error } = await db.auth.admin.createUser({
        email: entry.email, password: entry.password, email_confirm: true,
        app_metadata: { qa_e2e: true, qa_run_id: file.run_id, role },
        user_metadata: { qa_e2e: true, full_name: `Disposable QA ${name}` },
      });
      if (error || !data.user?.id) throw new Error(`QA Auth create failed: ${error?.status || 'missing user'}`);
      entry.user_id = data.user.id;
    }
    await save();
  }
  const { data, error } = await db.auth.admin.getUserById(entry.user_id);
  if (error || data.user?.app_metadata?.role !== role || data.user?.app_metadata?.qa_run_id !== file.run_id || !data.user?.email_confirmed_at) {
    throw new Error('QA Auth identity verification failed.');
  }
}
console.info(JSON.stringify({ project_ref: QA_PROJECT_REF, verified_auth_personas: file.personas.length, passwords_logged: false }));
