#!/usr/bin/env node
// Pulls applicant names and phone numbers for barber, nail, and cosmetology
// programs from Supabase and prints a formatted list to the console.

require('dotenv').config({ path: '.env.local' });

const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseGet(table, params) {
  return new Promise((resolve, reject) => {
    const qs  = new URLSearchParams(params).toString();
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}?${qs}`);
    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'GET',
      headers: {
        apikey:          SERVICE_KEY,
        Authorization:   `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        Prefer:          'count=exact',
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ rows: JSON.parse(data), status: res.statusCode }); }
        catch { resolve({ rows: [], status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const KEYWORDS = ['barber', 'nail', 'cosmetolog'];
const matches  = (str) => KEYWORDS.some(k => (str || '').toLowerCase().includes(k));

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // 1. Try program_enrollments joined with profiles + programs
  const { rows: enrollments } = await supabaseGet('program_enrollments', {
    select: 'id,status,created_at,profiles(full_name,phone,email),programs(title,slug)',
    limit:  1000,
  });

  // 2. Try applications table
  const { rows: applications } = await supabaseGet('applications', {
    select: 'id,status,created_at,profiles(full_name,phone,email),programs(title,slug)',
    limit:  1000,
  });

  // 3. Try intake_records
  const { rows: intake } = await supabaseGet('intake_records', {
    select: 'id,status,program_interest,full_name,phone,email,created_at',
    limit:  1000,
  });

  // 4. Try profiles directly with program interest field
  const { rows: profiles } = await supabaseGet('profiles', {
    select: 'id,full_name,phone,email,program_interest,created_at',
    limit:  1000,
  });

  // Normalize all sources into { name, phone, email, program, status, source }
  const all = [];

  (Array.isArray(enrollments) ? enrollments : []).forEach(r => {
    const prog = r.programs?.title || r.programs?.slug || '';
    if (!matches(prog)) return;
    all.push({
      name:    r.profiles?.full_name || '—',
      phone:   r.profiles?.phone     || '—',
      email:   r.profiles?.email     || '—',
      program: prog,
      status:  r.status || '—',
      source:  'program_enrollments',
    });
  });

  (Array.isArray(applications) ? applications : []).forEach(r => {
    const prog = r.programs?.title || r.programs?.slug || '';
    if (!matches(prog)) return;
    all.push({
      name:    r.profiles?.full_name || '—',
      phone:   r.profiles?.phone     || '—',
      email:   r.profiles?.email     || '—',
      program: prog,
      status:  r.status || '—',
      source:  'applications',
    });
  });

  (Array.isArray(intake) ? intake : []).forEach(r => {
    if (!matches(r.program_interest)) return;
    all.push({
      name:    r.full_name        || '—',
      phone:   r.phone            || '—',
      email:   r.email            || '—',
      program: r.program_interest || '—',
      status:  r.status           || '—',
      source:  'intake_records',
    });
  });

  (Array.isArray(profiles) ? profiles : []).forEach(r => {
    if (!matches(r.program_interest)) return;
    // Avoid duplicates already captured above
    const already = all.some(a => a.email === r.email && a.email !== '—');
    if (already) return;
    all.push({
      name:    r.full_name        || '—',
      phone:   r.phone            || '—',
      email:   r.email            || '—',
      program: r.program_interest || '—',
      status:  '—',
      source:  'profiles',
    });
  });

  if (all.length === 0) {
    console.log('\nNo applicants found across program_enrollments, applications, intake_records, or profiles.');
    console.log('Checking raw table structures...\n');

    // Debug: show first row of each table to understand schema
    for (const table of ['program_enrollments', 'applications', 'intake_records', 'profiles']) {
      const { rows } = await supabaseGet(table, { select: '*', limit: 1 });
      if (Array.isArray(rows) && rows.length > 0) {
        console.log(`\n${table} columns:`, Object.keys(rows[0]).join(', '));
      } else {
        console.log(`\n${table}: empty or inaccessible`);
      }
    }
    return;
  }

  // Group by program
  const groups = {};
  all.forEach(r => {
    const key = r.program.toLowerCase().includes('barber')     ? 'Barber'
              : r.program.toLowerCase().includes('nail')       ? 'Nail Technology'
              : r.program.toLowerCase().includes('cosmetolog') ? 'Cosmetology'
              : r.program;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  console.log('\n' + '='.repeat(70));
  console.log('APPLICANT LIST — Barber / Nail Technology / Cosmetology Programs');
  console.log('='.repeat(70));

  let total = 0;
  for (const [prog, rows] of Object.entries(groups)) {
    console.log(`\n── ${prog.toUpperCase()} (${rows.length}) ──`);
    rows.forEach((r, i) => {
      console.log(`  ${String(i + 1).padStart(2, ' ')}. ${r.name.padEnd(30)} ${r.phone.padEnd(18)} ${r.email}  [${r.status}]`);
    });
    total += rows.length;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL: ${total} applicants`);
  console.log('='.repeat(70) + '\n');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
