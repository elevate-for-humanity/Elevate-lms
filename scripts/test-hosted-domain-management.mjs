import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = await fs.readFile(new URL('../lib/domainee/site-resolver.ts', import.meta.url), 'utf8');
const rewritten = source
  .replace(/^import .* from .*;$/gm, '')
  .replace('const CUSTOM_DOMAIN_PLANS', `const { NextResponse, createClient, requireAdminClient, canManageHostedWebsite, getWebsiteBuilderAccess, syncIndividualAppSubscription, tenantPublicSiteUrl } = globalThis.__domainResolverDependencies;\nconst CUSTOM_DOMAIN_PLANS`);
function db(site) { return { from() { return { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: site, error: null }; } }; } }; }
let fixture;
const authDb = { auth: { async getUser() { return { data: { user: fixture.user } }; } } };
const serviceDb = db({ id: 'site-a', user_id: 'site-owner', subdomain: 'preview', site_name: 'Managed site', is_published: true });
globalThis.__domainResolverDependencies = {
  NextResponse: { json(body, options) { return { body, status: options?.status || 200 }; } },
  async createClient() { return authDb; },
  async requireAdminClient() { fixture.serviceLookups++; return serviceDb; },
  async canManageHostedWebsite(_db, id, actor) { fixture.authorization = { id, actor }; return fixture.canManage; },
  async getWebsiteBuilderAccess() { return { isAdmin: fixture.isAdmin }; },
  async syncIndividualAppSubscription() { fixture.billingLookups++; return fixture.subscription; },
  tenantPublicSiteUrl(slug) { return 'https://' + slug + '.app.elevateforhumanity.org'; },
};
const module = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(rewritten)).toString('base64'));
function setup(overrides = {}) { fixture = { user: { id: 'hosting-admin' }, serviceLookups: 0, billingLookups: 0, canManage: true, isAdmin: true, ...overrides }; }

test('assigned hosting administrator manages domains without changing billing ownership', async () => {
  setup();
  const result = await module.resolveOwnedSite('site-a');
  assert.equal(result.supabase, serviceDb);
  assert.equal(result.ownerUserId, 'site-owner');
  assert.equal(result.user.id, 'hosting-admin');
  assert.equal(result.entitlement.allowed, true);
  assert.equal(fixture.billingLookups, 0);
  assert.deepEqual(fixture.authorization, { id: 'site-a', actor: 'hosting-admin' });
});
test('customer without exact-site management cannot obtain domain service client', async () => {
  setup({ canManage: false, isAdmin: false });
  const result = await module.resolveOwnedSite('site-a');
  assert.equal(result.error.status, 404);
  assert.equal(result.supabase, undefined);
  assert.equal(fixture.billingLookups, 0);
});
test('ordinary owner still needs paid custom-domain entitlement', async () => {
  setup({ isAdmin: false, subscription: { plan: 'starter', status: 'active' } });
  const result = await module.resolveOwnedSite('site-a');
  assert.equal(result.entitlement.allowed, false);
  assert.equal(module.requireCustomDomainEntitlement(result.entitlement).status, 403);
});
test('unauthenticated requests never reach service records', async () => {
  setup({ user: null });
  const result = await module.resolveOwnedSite('site-a');
  assert.equal(result.error.status, 401);
  assert.equal(fixture.serviceLookups, 0);
});
