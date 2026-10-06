import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(process.env.BILLING_PORTAL_SOURCE || 'apps/marketing/app/api/store/billing-portal/route.ts', 'utf8');
const executable = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')) + '\nPOST';

function handler(provider, authenticated = true) {
  const query = { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { billing_provider: provider }, error: null }; } };
  return runInNewContext(executable, {
    LMS_HOST: 'https://app.elevateforhumanity.org',
    NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) },
    createClient: async () => ({ auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'owner' } : null } }) } }),
    requireAdminClient: async () => ({ from: () => query }),
    resolveTenantIdForUser: async () => 'tenant',
    resolveBillingOrganizationId: async () => 'organization',
  });
}

test('billing management reaches the LMS owner for every provider', async () => {
  for (const provider of ['quickbooks', 'paypal', null]) {
    const response = await handler(provider)();
    assert.equal(response.status, 200);
    assert.equal(response.body.url, 'https://app.elevateforhumanity.org/billing');
  }
});

test('billing management remains authenticated', async () => {
  const response = await handler('quickbooks', false)();
  assert.equal(response.status, 401);
  assert.equal(response.body.url, undefined);
});
