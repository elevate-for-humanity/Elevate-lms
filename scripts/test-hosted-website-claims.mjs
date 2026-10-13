import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
let fixture;
const authDb = { auth: { async getUser() { return { data: { user: fixture.user } }; } } };
const adminDb = { from(table) { return {
  select() { return this; }, eq() { return this; },
  async maybeSingle() { return { data: { id: 'site-a', user_id: 'actual-owner' } }; },
  upsert(payload) { fixture.payload = payload; return this; },
  async single() { return { data: { id: 'claim-a', status: fixture.payload.status }, error: null }; },
}; } };
globalThis.__claimDependencies = {
  NextResponse: { json(body, options) { return { body, status: options?.status || 200 }; } },
  async createClient() { return authDb; },
  async requireAdminClient() { fixture.adminLookups++; return adminDb; },
  async canManageHostedWebsite(_db, siteId, userId) { fixture.authorization = { siteId, userId }; return fixture.allowed; },
  async getWebsiteBuilderAccess() { return { allowed: true }; },
  async applyRateLimit() { return null; }, withApiAudit(_path, handler) { return handler; },
};
const source = await fs.readFile(new URL('../apps/marketing/app/api/apps/website-builder/sites/[websiteId]/claims/route.ts', import.meta.url), 'utf8');
const rewritten = source.replace(/^import .* from .*;$/gm, '').replace("export const runtime", "const { NextResponse, createClient, requireAdminClient, canManageHostedWebsite, getWebsiteBuilderAccess, applyRateLimit, withApiAudit } = globalThis.__claimDependencies;\nexport const runtime");
const module = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(rewritten)).toString('base64'));
function setup(overrides = {}) { fixture = { user: { id: 'hosting-admin' }, allowed: true, adminLookups: 0, ...overrides }; }
const request = { async json() { return { claimKey: 'business_fact', claimText: 'Business name', category: 'business_fact', evidenceReference: 'Owner provided record', status: 'verified', public_claim_allowed: true }; } };
test('hosting administrator submits evidence under site owner and cannot self-verify claims', async () => {
  setup();
  const result = await module.POST(request, { params: Promise.resolve({ websiteId: 'site-a' }) });
  assert.equal(result.status, 201);
  assert.equal(fixture.payload.owner_user_id, 'actual-owner');
  assert.equal(fixture.payload.status, 'pending_review');
  assert.equal(fixture.payload.public_claim_allowed, false);
  assert.equal(fixture.payload.verified_by, null);
  assert.deepEqual(fixture.authorization, { siteId: 'site-a', userId: 'hosting-admin' });
});
test('unassigned customer cannot read or write claims through admin client', async () => {
  setup({ allowed: false });
  const result = await module.POST(request, { params: Promise.resolve({ websiteId: 'site-a' }) });
  assert.equal(result.status, 404);
  assert.equal(fixture.adminLookups, 0);
  assert.equal(fixture.payload, undefined);
});
test('anonymous claims requests do not access privileged records', async () => {
  setup({ user: null });
  const result = await module.POST(request, { params: Promise.resolve({ websiteId: 'site-a' }) });
  assert.equal(result.status, 401);
  assert.equal(fixture.adminLookups, 0);
});
