import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canManageHostedWebsite } from '../lib/websites/can-manage-hosted-website.ts';
function database({owner='owner',organization='legacy',role='admin',membershipRole='org_admin',status='active',membershipOrg='legacy',fail=false}={}) {
 const rows={user_websites:[{id:'site',user_id:owner,organization_id:organization}],profiles:[{id:'actor',role}],organization_users:[{organization_id:membershipOrg,user_id:'actor',role:membershipRole,status}]};
 return {from(table){let filters=[];return {select(){return this},eq(key,value){filters.push([key,value]);return this},async maybeSingle(){return {error:fail?new Error('Unavailable'):null,data:rows[table].find(row=>filters.every(([key,value])=>row[key]===value))||null}}}}};
}
test('actual site owner retains management',async()=>assert.equal(await canManageHostedWebsite(database({owner:'actor'}),'site','actor'),true));
test('assigned platform administrator can manage hosted site',async()=>assert.equal(await canManageHostedWebsite(database(),'site','actor'),true));
test('customer org admin cannot become the hosting administrator',async()=>assert.equal(await canManageHostedWebsite(database({role:'student'}),'site','actor'),false));
test('another business membership grants no access',async()=>assert.equal(await canManageHostedWebsite(database({membershipOrg:'other'}),'site','actor'),false));
test('suspended administrator loses hosted access',async()=>assert.equal(await canManageHostedWebsite(database({status:'suspended'}),'site','actor'),false));
test('report viewer cannot edit',async()=>assert.equal(await canManageHostedWebsite(database({membershipRole:'report_viewer'}),'site','actor'),false));
test('database failures deny access',async()=>assert.equal(await canManageHostedWebsite(database({fail:true}),'site','actor'),false));
test('missing website denies access',async()=>assert.equal(await canManageHostedWebsite(database(),'missing','actor'),false));

// Exercise the actual route against an in-memory query boundary. The production
// authorization, backup ordering and conditional update all execute unchanged.
const { readFile } = await import('node:fs/promises');
const { stripTypeScriptTypes } = await import('node:module');
const revisionRoute = await readFile(new URL('../apps/marketing/app/api/apps/website-builder/sites/[websiteId]/revisions/route.ts', import.meta.url), 'utf8');
const routeFactory = new Function('canManageHostedWebsite', 'NextResponse', 'createClient', 'requireAdminClient', 'getWebsiteBuilderAccess',
  stripTypeScriptTypes(revisionRoute).replace(/^import .*;\r?$/gm, '').replace(/^export /gm, '') + '\nreturn { POST };');

function restoreFixture(options = {}) {
  const current = { id: 'site-a', user_id: 'owner', site_name: 'Current', subdomain: 'existing', site_config: { pages: [{ id: 'current' }] }, is_published: false, updated_at: options.nullTimestamp ? null : '2026-11-01T00:00:00Z' };
  const revision = { id: 'revision-a', website_id: 'site-a', site_name: 'Saved', subdomain: 'saved', site_config: { pages: [{ id: 'saved' }] }, is_published: false };
  const state = { current, revision, backups: [], updateAttempts: 0, reads: [] };
  const clone = value => JSON.parse(JSON.stringify(value));
  const db = { from(table) {
    const filters = [];
    let operation = 'read', values;
    const query = {
      select() { return this; },
      eq(key, value) { filters.push([key, value]); return this; },
      is(key, value) { filters.push([key, value]); return this; },
      insert(value) { operation = 'insert'; values = value; return this; },
      update(value) { operation = 'update'; values = value; return this; },
      then(resolve, reject) { return execute().then(resolve, reject); },
      async single() { return execute(); },
      async maybeSingle() { return execute(); },
    };
    function matches(row) { return filters.every(([key,value]) => row[key] === value); }
    async function execute() {
      if (operation === 'insert') {
        if (options.backupError) return { data: null, error: new Error('Backup storage unavailable') };
        if (options.missingBackup) return { data: null, error: null };
        state.backups.push({ ...clone(values), id: 'backup-a' });
        if (options.concurrentEdit) Object.assign(current, { site_name: 'Newer edit', site_config: { pages: [{ id: 'newer' }] }, updated_at: '2026-11-02T00:00:00Z' });
        return { data: { id: 'backup-a' }, error: null };
      }
      if (operation === 'update') {
        state.updateAttempts++;
        if (options.updateError) return { data: null, error: new Error('Write failed') };
        if (!matches(current)) return { data: null, error: null };
        Object.assign(current, clone(values));
        return { data: clone(current), error: null };
      }
      state.reads.push(table);
      const row = table === 'user_websites' ? current : revision;
      return { data: matches(row) ? clone(row) : null, error: null };
    }
    return query;
  } };
  const { POST } = routeFactory(async () => options.canManage !== false,
    { json: (body, init) => Response.json(body, init) },
    async () => ({ auth: { getUser: async () => ({ data: { user: options.signedIn === false ? null : { id: 'owner' } } }) } }),
    async () => db, async () => ({ allowed: options.hasAccess !== false }));
  return { state, async request(revisionId = 'revision-a') { return POST({ json: async () => ({ revisionId }) }, { params: Promise.resolve({ websiteId: 'site-a' }) }); } };
}

test('restore stops before any draft update if its rollback insert fails', async () => {
  const { state, request } = restoreFixture({ backupError: true });
  assert.equal((await request()).status, 500);
  assert.equal(state.updateAttempts, 0);
  assert.equal(state.current.site_name, 'Current');
});
test('restore requires a read-back backup ID before updating', async () => {
  const { state, request } = restoreFixture({ missingBackup: true });
  assert.equal((await request()).status, 500);
  assert.equal(state.updateAttempts, 0);
});
test('restore retains the exact previous draft before applying a saved version', async () => {
  const { state, request } = restoreFixture();
  const before = JSON.parse(JSON.stringify(state.current));
  const response = await request();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.backupRevisionId, 'backup-a');
  assert.equal(body.publicUrl, null);
  assert.equal(state.backups.length, 1);
  assert.deepEqual(state.backups[0].site_config, before.site_config);
  assert.equal(state.backups[0].subdomain, before.subdomain);
  assert.equal(state.backups[0].is_published, before.is_published);
  assert.equal(state.backups[0].website_id, 'site-a');
  assert.equal(state.backups[0].reason, 'before_restore');
  assert.deepEqual(state.current.site_config, state.revision.site_config);
});
test('restore refuses to overwrite a concurrent save and retains rollback history', async () => {
  const { state, request } = restoreFixture({ concurrentEdit: true });
  assert.equal((await request()).status, 409);
  assert.equal(state.current.site_name, 'Newer edit');
  assert.deepEqual(state.current.site_config, { pages: [{ id: 'newer' }] });
  assert.equal(state.backups.length, 1);
  assert.deepEqual(state.backups[0].site_config, { pages: [{ id: 'current' }] });
});
test('failed restore writes leave the original draft and its backup intact', async () => {
  const { state, request } = restoreFixture({ updateError: true });
  assert.equal((await request()).status, 500);
  assert.equal(state.current.site_name, 'Current');
  assert.equal(state.backups.length, 1);
});
test('legacy null timestamp snapshots still require a matching null during restore', async () => {
  const { request } = restoreFixture({ nullTimestamp: true });
  assert.equal((await request()).status, 200);
  const concurrent = restoreFixture({ nullTimestamp: true, concurrentEdit: true });
  assert.equal((await concurrent.request()).status, 409);
});
test('a revision from another website cannot create a backup or update the draft', async () => {
  const { state, request } = restoreFixture();
  state.revision.website_id = 'site-b';
  assert.equal((await request()).status, 404);
  assert.equal(state.backups.length, 0);
  assert.equal(state.updateAttempts, 0);
});
for (const [name, options, expected] of [
  ['signed-out caller', { signedIn: false }, 401],
  ['caller without builder access', { hasAccess: false }, 403],
  ['caller without exact project access', { canManage: false }, 404],
]) test(`${name} cannot restore or create rollback history`, async () => {
  const { state, request } = restoreFixture(options);
  assert.equal((await request()).status, expected);
  assert.equal(state.backups.length, 0);
  assert.equal(state.updateAttempts, 0);
});
