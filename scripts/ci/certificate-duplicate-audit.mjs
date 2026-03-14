/**
 * Pre-migration duplicate certificate audit.
 *
 * Run this BEFORE applying 20260319000001_certificate_idempotency.sql.
 * If any duplicates are found, resolve them manually before applying the migration.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/ci/certificate-duplicate-audit.mjs
 *
 * Exit 0 = no duplicates found, safe to apply migration.
 * Exit 1 = duplicates found, migration will fail — resolve first.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(2);
}

async function sql(query) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    // Fall back to direct query via PostgREST if exec_sql RPC not available
    return null;
  }
  return res.json();
}

async function query(table, select, filters = '') {
  const params = new URLSearchParams({ select });
  const res = await fetch(`${url}/rest/v1/${table}?${params}${filters}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Query failed: ${res.status} ${text}`);
  }
  return res.json();
}

let problems = 0;

console.log('Certificate duplicate audit\n');

// ── 1. Total certificate count ────────────────────────────────────────────
try {
  const res = await fetch(`${url}/rest/v1/certificates?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
  });
  const count = res.headers.get('content-range')?.split('/')[1] ?? '?';
  console.log(`Total certificates: ${count}`);
} catch (e) {
  console.error('Could not count certificates:', e.message);
}

// ── 2. Duplicate (student_id, course_id) ─────────────────────────────────
console.log('\nChecking (student_id, course_id) duplicates...');
try {
  // PostgREST doesn't support GROUP BY directly — use a workaround:
  // fetch all non-null student+course pairs and detect dupes client-side
  const rows = await query(
    'certificates',
    'student_id,course_id',
    '&student_id=not.is.null&course_id=not.is.null'
  );

  const seen = new Map();
  const dupes = [];
  for (const r of rows) {
    const k = `${r.student_id}::${r.course_id}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  for (const [k, n] of seen) {
    if (n > 1) {
      const [student_id, course_id] = k.split('::');
      dupes.push({ student_id, course_id, count: n });
    }
  }

  if (dupes.length === 0) {
    console.log('  ok    No (student_id, course_id) duplicates');
  } else {
    console.error(`  FAIL  ${dupes.length} duplicate (student_id, course_id) pair(s):`);
    for (const d of dupes) {
      console.error(`        student=${d.student_id} course=${d.course_id} count=${d.count}`);
    }
    problems += dupes.length;
  }
} catch (e) {
  console.error('  ERROR', e.message);
  problems++;
}

// ── 3. Duplicate (student_id, program_id) ────────────────────────────────
console.log('\nChecking (student_id, program_id) duplicates...');
try {
  const rows = await query(
    'certificates',
    'student_id,program_id',
    '&student_id=not.is.null&program_id=not.is.null'
  );

  const seen = new Map();
  const dupes = [];
  for (const r of rows) {
    const k = `${r.student_id}::${r.program_id}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  for (const [k, n] of seen) {
    if (n > 1) {
      const [student_id, program_id] = k.split('::');
      dupes.push({ student_id, program_id, count: n });
    }
  }

  if (dupes.length === 0) {
    console.log('  ok    No (student_id, program_id) duplicates');
  } else {
    console.error(`  FAIL  ${dupes.length} duplicate (student_id, program_id) pair(s):`);
    for (const d of dupes) {
      console.error(`        student=${d.student_id} program=${d.program_id} count=${d.count}`);
    }
    problems += dupes.length;
  }
} catch (e) {
  console.error('  ERROR', e.message);
  problems++;
}

// ── 4. Duplicate certificate_number ──────────────────────────────────────
console.log('\nChecking certificate_number duplicates...');
try {
  const rows = await query(
    'certificates',
    'certificate_number',
    '&certificate_number=not.is.null'
  );

  const seen = new Map();
  const dupes = [];
  for (const r of rows) {
    const k = r.certificate_number;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  for (const [k, n] of seen) {
    if (n > 1) dupes.push({ certificate_number: k, count: n });
  }

  if (dupes.length === 0) {
    console.log('  ok    No certificate_number duplicates');
  } else {
    console.error(`  FAIL  ${dupes.length} duplicate certificate_number(s):`);
    for (const d of dupes) {
      console.error(`        number=${d.certificate_number} count=${d.count}`);
    }
    problems += dupes.length;
  }
} catch (e) {
  console.error('  ERROR', e.message);
  problems++;
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (problems === 0) {
  console.log('\nAudit PASSED — safe to apply 20260319000001_certificate_idempotency.sql\n');
  process.exit(0);
} else {
  console.error(`\nAudit FAILED — ${problems} problem(s) found`);
  console.error('Resolve duplicates before applying the migration.\n');
  console.error('To find and keep the earliest certificate for each duplicate pair:');
  console.error('  DELETE FROM certificates WHERE id NOT IN (');
  console.error('    SELECT DISTINCT ON (student_id, course_id) id');
  console.error('    FROM certificates WHERE student_id IS NOT NULL AND course_id IS NOT NULL');
  console.error('    ORDER BY student_id, course_id, issued_at ASC');
  console.error('  );');
  process.exit(1);
}
