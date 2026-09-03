// Check remaining things: barber course row + courses row counts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}` };

async function get(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { ...H, Prefer: 'count=exact' } });
  const txt = await r.text();
  return { status: r.status, cr: r.headers.get('content-range'), body: txt.slice(0, 500) };
}

console.log('barber course row:', await get(`courses?id=eq.3fb5ce19-1cde-434c-a8c6-f138d7d7aa17&select=id,slug,title`));
console.log('\ncourses total:', await get('courses?select=id&limit=0'));
console.log('\nactive programs:', await get('programs?status=eq.active&select=id&limit=0'));
console.log('\npublished programs:', await get('programs?status=eq.published&select=id&limit=0'));
console.log('\nprograms without courses?  Sample 5 active program slugs:', await get('programs?status=eq.active&select=slug&limit=5'));
