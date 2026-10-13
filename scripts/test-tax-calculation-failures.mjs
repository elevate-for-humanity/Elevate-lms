import { existsSync } from 'node:fs';
import { compileTaxRoute, loadTaxRoute } from './tax-route-test-harness.mjs';
import assert from 'node:assert/strict';

// Exercise the route's HTTP contract with database failures at each boundary.
const path =
  process.argv[2] ||
  (existsSync('apps/marketing/app/api/tax/returns/calculate/route.ts')
    ? 'apps/marketing/app/api/tax/returns/calculate/route.ts'
    : 'app/api/tax/returns/calculate/route.ts');
const source = compileTaxRoute(path);
async function invoke(fault, malformed = false) {
  const writes = [];
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from(table) {
      let operation = 'read';
      const query = {
        select() {
          return query;
        },
        eq() {
          return query;
        },
        insert() {
          operation = 'insert';
          writes.push(table);
          return query;
        },
        update() {
          operation = 'update';
          writes.push(table);
          return query;
        },
        maybeSingle() {
          return query;
        },
        then(resolve, reject) {
          const error =
            fault === table || fault === `${table}:${operation}`
              ? { message: 'database failure' }
              : null;
          const data =
            table === 'tax_returns'
              ? {
                  id: 'return-1',
                  tax_year: 2026,
                  filing_status: fault === 'status' ? 'invalid' : 'single',
                }
              : table === 'tax_itemized_deductions'
                ? null
                : [];
          return Promise.resolve({
            data: fault === 'missing-update' && operation === 'update' ? null : data,
            error,
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const handler = loadTaxRoute(source, {
    'next/server': {
      NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) },
    },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/api/withRateLimit': { applyRateLimit: async () => null },
    '@/lib/tax-software/calculation/ty2026-base-1040': {
      STANDARD_DEDUCTION_2026: { single: 16100 },
      calculateBase1040_2026: () => ({
        totalIncome: 0,
        adjustedGrossIncome: 0,
        taxableIncome: 0,
        incomeTax: 0,
        totalTax: 0,
        totalPayments: 0,
        refundAmount: 0,
        amountOwed: 0,
      }),
    },
  });
  const response = await handler({
    json: async () => {
      if (malformed) throw Error('invalid JSON');
      return { returnId: 'return-1' };
    },
  });
  return { response, writes };
}
const cases = [
  ['malformed JSON', null, true, 400],
  ['unsupported filing status', 'status', false, 400],
  ['return read failed', 'tax_returns:read', false, 500],
  ['W-2 read failed', 'tax_w2_income', false, 500],
  ['1099 read failed', 'tax_1099_income', false, 500],
  ['business read failed', 'tax_schedule_c', false, 500],
  ['deductions read failed', 'tax_itemized_deductions', false, 500],
  ['calculation save failed', 'tax_calculations', false, 500],
  ['return save failed', 'tax_returns:update', false, 500],
  ['return update matched no row', 'missing-update', false, 500],
  ['successful persistence', null, false, 200],
];
let failures = 0;
for (const [name, fault, malformed, status] of cases) {
  try {
    const { response, writes } = await invoke(fault, malformed);
    assert.equal(response.status, status);
    assert.equal(response.body.success === true, status === 200);
    if (status === 400 || name.includes('read failed')) assert.equal(writes.length, 0);
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
