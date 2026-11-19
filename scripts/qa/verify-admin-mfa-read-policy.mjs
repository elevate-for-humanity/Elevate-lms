import { readFile, writeFile, chmod } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHmac, randomUUID } from 'node:crypto';

const { QA_PROJECT_REF, QA_SERVICE_KEY_FILE, QA_PERSONAS_FILE, QA_SDK_PACKAGE_JSON, QA_EVIDENCE_FILE } = process.env;
if (!QA_PROJECT_REF || QA_PROJECT_REF === 'cuxzzpsyufcewtmicszk' || !QA_SERVICE_KEY_FILE || !QA_PERSONAS_FILE || !QA_SDK_PACKAGE_JSON || !QA_EVIDENCE_FILE) throw new Error('Explicit isolated QA inputs required.');
const key = (await readFile(QA_SERVICE_KEY_FILE, 'utf8')).trim();
const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
const fixture = JSON.parse(await readFile(QA_PERSONAS_FILE, 'utf8'));
if (claims.ref !== QA_PROJECT_REF || fixture.project_ref !== QA_PROJECT_REF) throw new Error('QA project mismatch.');
const admin = fixture.personas.find(persona => persona.name === 'ADMIN' && persona.role === 'admin');
if (!admin) throw new Error('Disposable QA administrator is required.');
const { createClient } = createRequire(QA_SDK_PACKAGE_JSON)('@supabase/supabase-js');
const create = () => createClient(`https://${QA_PROJECT_REF}.supabase.co`, key, { auth: { persistSession: false, autoRefreshToken: false } });
const service = create(), db = create(), programId = randomUUID();
const code = secret => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = secret.toUpperCase().replace(/=+$/, '').split('').map(char => {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error('Invalid QA TOTP seed encoding.');
    return value.toString(2).padStart(5, '0');
  }).join('');
  const bytes = Buffer.from((bits.match(/.{8}/g) || []).map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac('sha1', bytes).update(counter).digest(), offset = digest[19] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
};
let evidence;
try {
  const inserted = await service.from('programs').insert({ id: programId, slug: `qa-mfa-${programId}`, title: 'Disposable QA MFA policy probe', category: 'QA', published: false });
  if (inserted.error) throw new Error(`QA MFA fixture insert failed: ${inserted.error.code}`);
  const login = await db.auth.signInWithPassword({ email: admin.email, password: admin.password });
  if (login.error || login.data.user?.id !== admin.user_id) throw new Error('QA admin password sign-in failed.');
  const before = await db.from('programs').select('id').eq('id', programId);
  if (before.error || before.data.length !== 0) throw new Error('Privileged AAL1 read was not denied.');
  if (!admin.totp_factor_id) {
    const existing = await db.auth.mfa.listFactors();
    if (existing.error || existing.data.all.length) throw new Error('Refusing to replace or adopt unknown QA MFA factors.');
    const enrolled = await db.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Disposable QA release verification' });
    if (enrolled.error || !enrolled.data?.totp?.secret) throw new Error('QA TOTP enrollment failed.');
    admin.totp_factor_id = enrolled.data.id;
    admin.totp_secret = enrolled.data.totp.secret;
    await writeFile(QA_PERSONAS_FILE, JSON.stringify(fixture, null, 2), { mode: 0o600 });
    await chmod(QA_PERSONAS_FILE, 0o600);
  }
  const verified = await db.auth.mfa.challengeAndVerify({ factorId: admin.totp_factor_id, code: code(admin.totp_secret) });
  if (verified.error) throw new Error(`QA TOTP verification failed: ${verified.error.status || 'unknown'}`);
  const assurance = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error || assurance.data.currentLevel !== 'aal2') throw new Error('QA administrator did not reach real AAL2.');
  const after = await db.from('programs').select('id').eq('id', programId);
  if (after.error || after.data.length !== 1 || after.data[0].id !== programId) throw new Error('Verified AAL2 administrator read failed.');
  evidence = { project_ref: QA_PROJECT_REF, checked_at: new Date().toISOString(), real_auth_mfa: true, privileged_aal1_read_denied: true, verified_totp_aal2_read_allowed: true, test_fixture_removed: false, production_accessed: false, full_browser_e2e_certified: false };
} finally {
  await db.auth.signOut();
  const removed = await service.from('programs').delete().eq('id', programId);
  const remaining = await service.from('programs').select('id').eq('id', programId);
  if (removed.error || remaining.error || remaining.data.length) throw new Error('QA MFA fixture cleanup failed.');
  if (evidence) evidence.test_fixture_removed = true;
}
await writeFile(QA_EVIDENCE_FILE, JSON.stringify(evidence, null, 2));
console.info(JSON.stringify(evidence));
