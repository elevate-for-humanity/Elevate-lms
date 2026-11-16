/**
 * Isolated, production-safe cross-shop QA harness.
 * Reuses the existing disposable apprenticeship fixture twice with distinct run IDs.
 * Does not read/write any existing student/shop/Program Holder record.
 */
import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const action = process.argv[2];
const prefix = process.env.QA_CROSS_SHOP_PREFIX || '.qa-host-shop-cross';
const statePaths = [prefix + '-a.json', prefix + '-b.json'];
const registryPath = prefix + '-requests.json';
const rootRun = process.env.GITHUB_RUN_ID || String(Date.now());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing QA database configuration');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function fixture(index, operation) {
  const env = { ...process.env, GITHUB_RUN_ID: rootRun + '-shop-' + index,
    QA_E2E_STATE_PATH: statePaths[index], GITHUB_ENV: '' };
  const child = spawnSync(process.execPath,
    ['scripts/qa/provision-apprenticeship-e2e.mjs', operation],
    { env, encoding: 'utf8' });
  if (child.status !== 0) {
    // Child logs contain no passwords; never print the private fixture state.
    throw new Error('QA shop ' + index + ' ' + operation + ' failed: ' +
      String(child.stderr || child.stdout || '').slice(-1200));
  }
}

async function cleanup() {
  // A match request must be deleted before its temporary student/shop.
  let ids = [];
  try { ids = JSON.parse(await readFile(registryPath, 'utf8')).requestIds || []; }
  catch { /* No match fixture was persisted. */ }
  const failures = [];
  for (const id of ids) {
    const { error } = await db.from('host_shop_match_requests').delete().eq('id', id);
    if (error) failures.push('QA match cleanup failed for ' + id + ': ' + error.message);
  }
  // Attempt cleanup of both shops even if the first fails. Keep the explicit
  // failure visible and never imply teardown succeeded without verification.
  for (const index of [1, 0]) {
    try { await fixture(index, 'cleanup'); }
    catch (error) { failures.push(String(error)); }
  }
  if (failures.length) throw new Error('Disposable QA cleanup incomplete: ' + failures.join(' | '));
  console.log('Disposable cross-shop fixture cleanup complete');
}
async function provision() {
  try {
    for (const index of [0, 1]) await fixture(index, 'provision');
    const [a,b] = await Promise.all(statePaths.map(async path =>
      JSON.parse(await readFile(path, 'utf8'))));
    if (!a.host?.id || !b.host?.id || !a.shopId || !b.shopId ||
        a.shopId === b.shopId || a.host.id === b.host.id)
      throw new Error('Two distinct shop identities and memberships are required');
    const requestIds = [];
    for (const row of [a,b]) {
      const { data, error } = await db.from('host_shop_match_requests').insert({
        apprentice_id: row.apprentice.id,
        apprentice_name: '[QA E2E] Barber Apprentice',
        apprentice_email: row.apprentice.email,
        host_shop_id: row.shopId,
        program_slug: 'barber-apprenticeship',
        message: '[QA E2E] Sensitive fixture message - must never appear in Host Shop API',
        apprentice_notes: '[QA E2E] Sensitive fixture notes - must never appear in Host Shop API',
        status: 'pending',
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      }).select('id').single();
      if (error || !data?.id) throw new Error('Could not create isolated match fixture: ' + error?.message);
      requestIds.push(data.id);
      await writeFile(registryPath, JSON.stringify({requestIds}), {mode:0o600});
    }
    if (!process.env.GITHUB_ENV) throw new Error('GitHub environment output required for authenticated run');
    const vars = {
      QA_SHOP_A_EMAIL: a.host.email, QA_SHOP_A_PASSWORD: a.host.password,
      QA_SHOP_A_STUDENT_EMAIL: a.apprentice.email, QA_SHOP_A_MATCH_ID: requestIds[0],
      QA_SHOP_B_EMAIL: b.host.email, QA_SHOP_B_PASSWORD: b.host.password,
      QA_SHOP_B_STUDENT_EMAIL: b.apprentice.email, QA_SHOP_B_MATCH_ID: requestIds[1],
    };
    for (const password of [a.host.password,b.host.password]) console.log('::add-mask::' + password);
    await writeFile(process.env.GITHUB_ENV,
      Object.entries(vars).map(([k,v])=>k+'='+v).join('\n')+'\n',{flag:'a'});
    console.log('Two separate approved disposable shops and matching requests provisioned');
  } catch(error) {
    try { await cleanup(); } catch(e) { console.error('QA cleanup requires review:',String(e)); }
    throw error;
  }
}
if (action === 'provision') await provision();
else if (action === 'cleanup') await cleanup();
else throw new Error('Expected provision or cleanup');
