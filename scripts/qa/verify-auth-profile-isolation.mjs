import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const { QA_PROJECT_REF, QA_SERVICE_KEY_FILE, QA_PERSONAS_FILE, QA_SDK_PACKAGE_JSON, QA_EVIDENCE_FILE } = process.env;
if (!QA_PROJECT_REF || QA_PROJECT_REF === 'cuxzzpsyufcewtmicszk' || !QA_SERVICE_KEY_FILE || !QA_PERSONAS_FILE || !QA_SDK_PACKAGE_JSON || !QA_EVIDENCE_FILE) {
  throw new Error('Explicit isolated QA inputs required.');
}
const key = (await readFile(QA_SERVICE_KEY_FILE, 'utf8')).trim();
const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
const fixture = JSON.parse(await readFile(QA_PERSONAS_FILE, 'utf8'));
if (claims.ref !== QA_PROJECT_REF || fixture.project_ref !== QA_PROJECT_REF || fixture.personas.length !== 9) throw new Error('QA project/persona mismatch.');
const require = createRequire(QA_SDK_PACKAGE_JSON);
const { createClient } = require('@supabase/supabase-js');
const create = () => createClient(`https://${QA_PROJECT_REF}.supabase.co`, key, { auth: { persistSession: false, autoRefreshToken: false } });
const results = [];
for (const persona of fixture.personas) {
  const db = create();
  try {
    const session = await db.auth.signInWithPassword({ email: persona.email, password: persona.password });
    if (session.error || session.data.user?.id !== persona.user_id || !session.data.session?.access_token) throw new Error('Actual QA password sign-in failed.');
    const { data, error } = await db.from('profiles').select('id,role');
    const privileged = ['admin', 'staff'].includes(persona.role);
    if (error || data.length !== (privileged ? 9 : 1) || !data.some(row => row.id === persona.user_id && row.role === persona.role)) throw new Error('Actual QA profile SELECT authorization failed.');
    if (!privileged && data.some(row => row.id !== persona.user_id)) throw new Error('Cross-user profile disclosure.');
    results.push({ persona: persona.name, role: persona.role, actual_password_sign_in: true, visible_profiles: data.length, own_role_verified: true, cross_user_denial_verified: !privileged });
    if (persona.role === 'student') {
      const update = await db.from('profiles').update({ role: 'admin' }).eq('id', persona.user_id);
      if (!update.error || update.error.code !== '42501') throw new Error('Unprivileged QA role mutation was not denied.');
      const own = await db.from('profiles').select('role').eq('id', persona.user_id).single();
      if (own.error || own.data.role !== 'student') throw new Error('QA role changed unexpectedly.');
    }
  } finally {
    const { error: signOutError } = await db.auth.signOut({ scope: 'local' });
    if (signOutError) throw new Error('QA session sign-out failed.');
  }
}
const evidence = { project_ref: QA_PROJECT_REF, checked_at: new Date().toISOString(), stage: 'auth_and_minimal_profile_read_only', full_application_e2e_ready: false, persona_count: results.length, results, learner_role_write_denied: true, sessions_signed_out: true, production_accessed: false };
await writeFile(QA_EVIDENCE_FILE, JSON.stringify(evidence, null, 2));
console.info(JSON.stringify({ verified_personas: results.length, real_password_auth: true, own_profile_reads_verified: true, learner_role_write_denied: true, full_application_e2e_ready: false }));
