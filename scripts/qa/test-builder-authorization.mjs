import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

// Genuine disposable Auth sessions against the existing isolated QA project.
// Never target production or claim this API test is browser acceptance.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url !== 'https://isdgjcdabhxxozarmxta.supabase.co' || !anon || !service) {
  throw new Error('The explicit isolated QA URL and both QA API keys are required.');
}
const require = createRequire(process.env.QA_SDK_PACKAGE_JSON || new URL('../../package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, service, options);
const run = `builder-auth-${randomUUID()}`;
const users = [];
const organizations = [];
const sites = [];
const sessions = [];
let mainError;
const check = (result, label) => {
  if (result.error) throw new Error(`${label} failed (${result.error.code || result.error.status || 'unknown'}).`);
  return result.data;
};
const mustDeny = (result, label) => assert.equal(result.error?.code, '42501', label);
const wallet = (db, id, amount) => db.rpc('ensure_app_trial_wallet', {
  p_user_id: id, p_app_slug: 'website-builder', p_trial_credits: amount,
});

try {
  // Fresh real accounts avoid modifying or revoking sessions for shared personas.
  for (let index = 0; index < 2; index++) {
    const email = `${run}-${index}@example.invalid`;
    const password = randomBytes(36).toString('base64url');
    const created = check(await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      app_metadata: { qa_e2e: true, qa_run_id: run, role: 'student' },
    }), 'Disposable Auth creation');
    assert.ok(created.user?.id, 'Auth returned a real user');
    users.push(created.user.id);
    const org = check(await admin.from('organizations').insert({
      name: run, slug: `${run}-${index}`,
    }).select('id').single(), 'Organization fixture');
    organizations.push(org.id);
    check(await admin.from('profiles').insert({
      id: created.user.id, email, full_name: 'Disposable builder QA',
      role: 'student', organization_id: org.id, enrollment_status: 'pending', is_active: true,
    }), 'Ordinary profile fixture');
    const db = createClient(url, anon, options);
    sessions.push(db);
    const signedIn = check(await db.auth.signInWithPassword({ email, password }), 'Real password login');
    assert.equal(signedIn.user.id, created.user.id);
    assert.equal(signedIn.user.app_metadata.role, 'student');
  }
  const [owner, member] = sessions;
  const [ownerId, memberId] = users;
  mustDeny(await wallet(owner, ownerId, 2147483647), 'No trial cannot mint credits');
  check(await admin.from('user_app_subscriptions').insert({
    user_id: ownerId, app_slug: 'website-builder', plan: 'starter', status: 'trial',
    trial_ends_at: new Date(Date.now() + 86400000).toISOString(),
  }), 'Disposable free-trial fixture');
  assert.equal(check(await wallet(owner, ownerId, 2147483647), 'Bounded trial grant'), 500);
  const saved = check(await admin.from('user_app_credit_wallets')
    .select('balance,lifetime_granted').eq('user_id', ownerId).eq('app_slug', 'website-builder').single(), 'Saved wallet');
  assert.deepEqual(saved, { balance: 500, lifetime_granted: 500 });
  mustDeny(await wallet(member, ownerId, 2147483647), 'Another user cannot initialize a wallet');
  const used = check(await owner.rpc('consume_app_credits', {
    p_user_id: ownerId, p_app_slug: 'website-builder', p_operation: 'qa_authorization', p_cost: 8,
  }), 'Own credit consumption');
  assert.deepEqual(used, [{ success: true, balance: 492 }]);
  assert.equal(check(await wallet(owner, ownerId, 2147483647), 'Wallet replay'), 492, 'Repeat grants cannot refill credits');
  check(await admin.from('user_app_subscriptions').update({
    trial_ends_at: new Date(Date.now() - 60000).toISOString(),
  }).eq('user_id', ownerId).eq('app_slug', 'website-builder'), 'Expired trial fixture');
  mustDeny(await wallet(owner, ownerId, 500), 'Expired trial cannot initialize a wallet');

  check(await admin.from('organization_users').insert([
    { organization_id: organizations[0], user_id: ownerId, role: 'org_owner', status: 'active' },
    { organization_id: organizations[0], user_id: memberId, role: 'instructor', status: 'active' },
  ]), 'Organization membership fixtures');
  for (let index = 0; index < 2; index++) {
    const site = check(await admin.from('user_websites').insert({
      user_id: users[index], organization_id: organizations[index], site_name: run,
      status: 'draft', is_published: false, site_config: { meta: { qa_run_id: run } },
    }).select('id').single(), 'Unpublished site fixture');
    sites.push(site.id);
  }
  const memberRead = check(await member.from('user_websites').select('id').eq('id', sites[0]), 'Member read positive control');
  assert.equal(memberRead.length, 1, 'A member must retain allowed read access');
  const deniedDelete = await member.from('user_websites').delete().eq('id', sites[0]).select('id');
  if (deniedDelete.error) mustDeny(deniedDelete, 'Member delete must be denied');
  else assert.deepEqual(deniedDelete.data, [], 'A nonmanager must not delete an organization website');
  assert.ok(check(await admin.from('user_websites').select('id').eq('id', sites[0]).single(), 'Site remains after denied delete'));
  mustDeny(await owner.from('website_revisions').insert({
    website_id: sites[1], user_id: ownerId, site_config: {}, reason: 'qa_forgery_attempt',
  }), 'Foreign website revision must be rejected');
  check(await owner.from('website_revisions').insert({
    website_id: sites[0], user_id: ownerId, site_config: {}, reason: 'qa_authorized_revision',
  }), 'Own revision positive control');
  check(await admin.from('organization_users').update({ role: 'org_admin' })
    .eq('organization_id', organizations[0]).eq('user_id', memberId), 'Manager membership fixture');
  const managerDelete = check(await member.from('user_websites').delete().eq('id', sites[0]).select('id'), 'Manager delete positive control');
  assert.equal(managerDelete.length, 1, 'An authorized organization manager retains delete access');
} catch (error) {
  mainError = error;
} finally {
  const cleanupErrors = [];
  const clean = async (operation, label) => {
    try { check(await operation(), label); } catch { cleanupErrors.push(label); }
  };
  for (const db of sessions) await clean(() => db.auth.signOut({ scope: 'local' }), 'Local session cleanup');
  if (sites.length) await clean(() => admin.from('user_websites').delete().in('id', sites), 'Site cleanup');
  if (organizations.length) await clean(() => admin.from('organization_users').delete().in('organization_id', organizations), 'Membership cleanup');
  if (users.length) {
    for (const table of ['user_app_credit_ledger', 'user_app_credit_wallets', 'user_app_subscriptions']) {
      await clean(() => admin.from(table).delete().in('user_id', users), `${table} fixture cleanup`);
    }
    await clean(() => admin.from('profiles').delete().in('id', users), 'Profile fixture cleanup');
  }
  for (const id of users) await clean(() => admin.auth.admin.deleteUser(id), 'Disposable Auth cleanup');
  if (organizations.length) await clean(() => admin.from('organizations').delete().in('id', organizations), 'Organization cleanup');
  // Cleanup is a required verdict, not an unchecked best effort.
  if (sites.length) {
    try {
      const remaining = check(await admin.from('user_websites').select('id').in('id', sites), 'Site cleanup verification');
      assert.equal(remaining.length, 0);
      const revisions = check(await admin.from('website_revisions').select('id').in('website_id', sites), 'Revision cleanup verification');
      assert.equal(revisions.length, 0);
    } catch { cleanupErrors.push('Site/revision cleanup verification'); }
  }
  for (const table of ['profiles', 'user_app_subscriptions', 'user_app_credit_wallets', 'user_app_credit_ledger']) {
    if (!users.length) break;
    try {
      const column = table === 'profiles' ? 'id' : 'user_id';
      const remaining = check(await admin.from(table).select(column).in(column, users), `${table} cleanup verification`);
      assert.equal(remaining.length, 0);
    } catch { cleanupErrors.push(`${table} cleanup verification`); }
  }
  if (cleanupErrors.length) throw new Error(`QA builder cleanup incomplete: ${cleanupErrors.join(', ')}`);
}
if (mainError) throw new Error('Isolated QA builder authorization assertions failed.', { cause: mainError });
console.info(JSON.stringify({
  project_ref: 'isdgjcdabhxxozarmxta', test: 'builder_authorization',
  real_password_logins: 2, wallet_cap: 500, repeat_refill_denied: true,
  foreign_wallet_denied: true, expired_trial_denied: true,
  member_read_allowed: true, member_delete_denied: true, manager_delete_allowed: true,
  forged_revision_denied: true, owner_revision_allowed: true,
  fixture_cleanup_verified: true, browser_acceptance: false,
}));
