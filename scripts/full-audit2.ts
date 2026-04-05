import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const env = readFileSync('/workspaces/Elevate-lms/.env.local', 'utf8');
const getEnv = (key: string) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1].trim() ?? null;
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')!;
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(url, key);

// Get real table list by probing known tables and using pg_tables via RPC
// Use the REST API directly to query pg_tables
const resp = await fetch(`${url}/rest/v1/rpc/get_tables`, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({})
});

// Fallback: probe every table referenced in code
const fromMatches = execSync(
  `grep -roh "\\.from('[^']*')" /workspaces/Elevate-lms/app /workspaces/Elevate-lms/lib /workspaces/Elevate-lms/components --include="*.ts" --include="*.tsx" 2>/dev/null`,
  { maxBuffer: 20 * 1024 * 1024 }
).toString();

const codeTables = [...new Set(
  [...fromMatches.matchAll(/\.from\('([^']+)'\)/g)].map(m => m[1])
)].filter(t => !t.includes('-')).sort();

console.log(`\nProbing ${codeTables.length} unique tables referenced in code...`);

const results = {
  exists: [] as string[],
  missing: [] as string[],
  empty: [] as string[],
  hasData: [] as {table: string, count: number}[],
};

// Probe in batches
for (const t of codeTables) {
  const { count, error } = await db.from(t as any).select('*', { count: 'exact', head: true });
  if (error) {
    if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
      results.missing.push(t);
    } else {
      // Table exists but RLS blocks count — still exists
      results.exists.push(t);
    }
  } else {
    results.exists.push(t);
    if (count === 0) results.empty.push(t);
    else results.hasData.push({ table: t, count: count! });
  }
}

// Hyphenated
const hyphenated = [...new Set(
  [...fromMatches.matchAll(/\.from\('([^']+)'\)/g)].map(m => m[1])
)].filter(t => t.includes('-')).sort();

console.log('\n════════════════════════════════════════════════════════');
console.log('  DATABASE vs CODE AUDIT');
console.log('════════════════════════════════════════════════════════');
console.log(`\n  Tables referenced in code:  ${codeTables.length + hyphenated.length}`);
console.log(`  Exist in DB:                ${results.exists.length}`);
console.log(`  MISSING from DB:            ${results.missing.length}`);
console.log(`  Exist but EMPTY (0 rows):   ${results.empty.length}`);
console.log(`  Hyphenated (always broken): ${hyphenated.length}`);

console.log('\n─── ❌ MISSING — in code, not in DB ───');
// Group by reference count
const missingWithRefs = results.missing.map(t => {
  const refs = parseInt(execSync(`grep -r "from('${t}')" /workspaces/Elevate-lms/app --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l`).toString().trim());
  return { t, refs };
}).filter(x => x.refs > 0).sort((a,b) => b.refs - a.refs);

const missingNoRefs = results.missing.filter(t => 
  !missingWithRefs.find(x => x.t === t)
);

console.log('\n  High impact (most code references):');
missingWithRefs.slice(0, 40).forEach(({t, refs}) => 
  console.log(`    ${String(refs).padStart(4)} refs  ${t}`)
);

console.log('\n─── ⚠️  EMPTY TABLES (exist but 0 rows) ───');
results.empty.sort().forEach(t => console.log(`    ${t}`));

console.log('\n─── ⚠️  HYPHENATED TABLE NAMES (broken) ───');
hyphenated.forEach(t => console.log(`    ${t}`));

console.log('\n─── ✅ HAS DATA (top 30 by row count) ───');
results.hasData.sort((a,b) => b.count - a.count).slice(0,30).forEach(({table, count}) =>
  console.log(`  ${String(count).padStart(6)}  ${table}`)
);

// Missing env vars
const envVarsInCode = execSync(
  `grep -roh "process\\.env\\.[A-Z_]*" /workspaces/Elevate-lms/app /workspaces/Elevate-lms/lib --include="*.ts" --include="*.tsx" 2>/dev/null`,
  { maxBuffer: 10 * 1024 * 1024 }
).toString();
const referencedEnvVars = [...new Set([...envVarsInCode.matchAll(/process\.env\.([A-Z_]+)/g)].map(m => m[1]))].sort();
const missingEnvVars = referencedEnvVars.filter(v => !env.includes(v + '='));

console.log('\n─── 🔑 MISSING ENV VARS ───');
if (missingEnvVars.length === 0) console.log('  All env vars present');
else missingEnvVars.forEach(v => console.log('  ' + v));

console.log('\n════════════════════════════════════════════════════════\n');
