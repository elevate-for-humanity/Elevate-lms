#!/usr/bin/env node

/**
 * Production portal data-integrity gate.
 *
 * Calls the service-only portal_data_integrity_report() RPC. This is intended
 * for trusted CI/deployment environments where the Supabase service-role key
 * is available. It fails closed: missing credentials, RPC errors, malformed
 * responses, or any failed integrity check block production promotion.
 */

const supabaseUrl = String(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
).replace(/\/$/, '');
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

if (!supabaseUrl) {
  console.error('❌ Portal data integrity: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL is required.');
  process.exit(1);
}
if (!serviceKey) {
  console.error('❌ Portal data integrity: SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const response = await fetch(`${supabaseUrl}/rest/v1/rpc/portal_data_integrity_report`, {
  method: 'POST',
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
  body: '{}',
});

if (!response.ok) {
  const body = await response.text().catch(() => '');
  console.error(`❌ Portal data integrity RPC failed: HTTP ${response.status}`);
  if (body) console.error(body.slice(0, 1200));
  process.exit(1);
}

const rows = await response.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('❌ Portal data integrity RPC returned no checks.');
  process.exit(1);
}

let failures = 0;
for (const row of rows) {
  const name = String(row?.check_name || 'unknown_check');
  const ok = row?.ok === true;
  const issueCount = Number(row?.issue_count || 0);
  if (ok) {
    console.log(`✅ ${name}: 0 issues`);
  } else {
    failures += 1;
    console.error(`❌ ${name}: ${issueCount} issue(s)`);
    if (row?.details) console.error(JSON.stringify(row.details));
  }
}

if (failures > 0) {
  console.error(`\n❌ Portal data integrity FAILED — ${failures} check(s) failed.`);
  process.exit(1);
}

console.log(`\n✅ Portal data integrity PASSED — ${rows.length} authoritative checks green.`);
