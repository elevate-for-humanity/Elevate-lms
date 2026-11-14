import { existsSync } from 'node:fs';
import { compileTaxRoute, loadTaxRoute } from './tax-route-test-harness.mjs';
import assert from 'node:assert/strict';
const file =
  process.argv[2] ||
  (existsSync('apps/marketing/app/api/tax/w2/confirm/route.ts')
    ? 'apps/marketing/app/api/tax/w2/confirm/route.ts'
    : 'app/api/tax/w2/confirm/route.ts');
const source = compileTaxRoute(file);
const jsonResponse = (body, options) => ({ body, status: options?.status || 200, headers: options?.headers });
const taxJson = loadTaxRoute(compileTaxRoute('lib/tax-software/server/response.ts'), {
  'next/server': { NextResponse: { json: jsonResponse } },
}, 'taxJson');
async function run(body, user = true, owns = true) {
  const inserts = [];
  const filters = [];
  const db = {
    auth: { getUser: async () => ({ data: { user: user ? { id: 'owner' } : null } }) },
    from(table) {
      const q = {
        select() {
          return q;
        },
        eq(k, v) {
          filters.push([k, v]);
          return q;
        },
        maybeSingle() {
          return q;
        },
        single() {
          return q;
        },
        insert(row) {
          inserts.push({ table, row });
          return q;
        },
        then(resolve, reject) {
          return Promise.resolve({
            data: table === 'tax_returns' ? (owns ? { id: 'r' } : null) : { id: 'w' },
            error: null,
          }).then(resolve, reject);
        },
      };
      return q;
    },
  };
  const handler = loadTaxRoute(source, {
    'next/server': { NextResponse: { json: jsonResponse } },
    '@/lib/tax-software/server/response': { taxJson },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/api/withRateLimit': { applyRateLimit: async () => null },
  });
  const res = await handler({
    json: async () => {
      if (body === null) throw Error('bad json');
      return body;
    },
  });
  return { res, inserts, filters };
}
const base = {
  returnId: 'r',
  employerEin: '12-3456789',
  employerName: 'Test fixture employer',
  wages: '100',
  federalWithholding: '10',
};
for (const [label, body, user, owns, status] of [
  ['authentication required', base, false, true, 401],
  ['foreign return denied', base, true, false, 404],
  ['malformed JSON rejected', null, true, true, 400],
  ['invalid wages rejected', { ...base, wages: 'NaN' }, true, true, 400],
  ['negative withholding rejected', { ...base, federalWithholding: '-1' }, true, true, 400],
  ['invalid EIN rejected', { ...base, employerEin: 'oops' }, true, true, 400],
  ['invalid value types rejected', { ...base, wages: true }, true, true, 400],
  ['blank optional amount stays unset', { ...base, stateWages: '' }, true, true, 200],
  ['explicit zero amount persists', { ...base, stateWages: 0 }, true, true, 200],
  ['confirmed values persist', base, true, true, 200],
]) {
  const r = await run(body, user, owns);
  assert.equal(r.res.status, status);
  assert.equal(r.res.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(r.res.headers.get('Vary'), 'Cookie');
  if (label === 'blank optional amount stays unset') assert.equal(r.inserts[0].row.state_wages, null);
  if (label === 'explicit zero amount persists') assert.equal(r.inserts[0].row.state_wages, 0);
  if (status !== 200) assert.equal(r.inserts.length, 0);
  if (status === 200) {
    assert.ok(r.filters.some(([k, v]) => k === 'created_by_user_id' && v === 'owner'));
    assert.ok(r.filters.some(([k, v]) => k === 'service_type' && v === 'self_file'));
    assert.equal(r.inserts[0].row.wages, 100);
  }
  console.log('PASS ' + label);
}
