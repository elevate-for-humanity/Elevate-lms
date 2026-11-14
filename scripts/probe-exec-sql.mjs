// Probe exec_sql response shape
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function q(sql) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SKEY, Authorization: `Bearer ${SKEY}` },
    body: JSON.stringify({ sql }),
  });
  return { status: r.status, text: await r.text() };
}

console.log('--- SELECT 1 ---');
console.log(await q('SELECT 1 AS ok;'));
console.log('\n--- SELECT count from programs ---');
console.log(await q('SELECT count(*) AS c FROM public.programs;'));
console.log('\n--- to_regclass ---');
console.log(await q("SELECT to_regclass('public.programs') IS NOT NULL AS exists;"));
console.log('\n--- multi row ---');
console.log(await q("SELECT slug, status FROM public.programs LIMIT 3;"));
