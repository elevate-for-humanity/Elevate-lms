#!/usr/bin/env node
/**
 * Looks up users by email and sets their correct role in the profiles table.
 * Uses service role key — bypasses RLS.
 */
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Everyone who signed up + their correct role
const USERS = [
  { email: 'Cldamd.davis@gmail.com',     role: 'staff',         name: 'Alberta Davis' },
  { email: 'anitabell85@gmail.com',       role: 'partner',       name: 'Anita Bell' },
  { email: 'CarlinaWilkes@yahoo.com',     role: 'partner',       name: 'Carlina Wilkes' },
  { email: 'sharen710@gmail.com',         role: 'partner',       name: 'Sharen Douglas-Brown' },
  { email: 'Jozannageorge@outlook.com',   role: 'partner',       name: 'Jozanna George' },
];

function supabaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'cuxzzpsyufcewtmicszk.supabase.co',
      path,
      method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function fixRoles() {
  console.log('Fixing user roles in Supabase profiles table...\n');

  for (const u of USERS) {
    // Look up user id by email via auth admin API
    const lookup = await supabaseRequest('GET', `/auth/v1/admin/users?email=${encodeURIComponent(u.email.toLowerCase())}`, null);

    let userId = null;
    if (lookup.status === 200) {
      const users = lookup.body?.users || [];
      // match case-insensitively
      const match = users.find(x => x.email?.toLowerCase() === u.email.toLowerCase());
      if (match) userId = match.id;
    }

    if (!userId) {
      console.log(`⚠️  ${u.name} (${u.email}) — not found in auth yet (hasn't signed up)`);
      continue;
    }

    // Update profiles table
    const update = await supabaseRequest(
      'PATCH',
      `/rest/v1/profiles?id=eq.${userId}`,
      { role: u.role }
    );

    if (update.status === 200 || update.status === 204) {
      console.log(`✅ ${u.name} — role set to '${u.role}' (id: ${userId})`);
    } else {
      console.log(`❌ ${u.name} — update failed (${update.status}):`, update.body);
    }
  }

  console.log('\nDone. Users who have not signed up yet will be fixed automatically when they do.');
}

fixRoles().catch(console.error);
