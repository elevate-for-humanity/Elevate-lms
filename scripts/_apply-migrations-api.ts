/**
 * Apply migrations via Supabase Management API.
 * Strips top-level BEGIN/COMMIT — API runs each call in its own transaction.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const PROJECT_REF = 'cuxzzpsyufcewtmicszk';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN!;

if (!ACCESS_TOKEN) { console.error('SUPABASE_ACCESS_TOKEN not set'); process.exit(1); }

async function runQuery(query: string): Promise<{ error?: string }> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ACCESS_TOKEN}` },
      body: JSON.stringify({ query }),
    }
  );
  const body = await res.json() as any;
  if (!res.ok) return { error: body?.message ?? JSON.stringify(body) };
  return {};
}

async function applyFile(file: string) {
  const fullPath = path.join(process.cwd(), file);
  let sql = fs.readFileSync(fullPath, 'utf8');
  sql = sql
    .replace(/^BEGIN\s*;\s*$/gim, '-- BEGIN stripped')
    .replace(/^COMMIT\s*;\s*$/gim, '-- COMMIT stripped')
    .replace(/^ROLLBACK\s*;\s*$/gim, '-- ROLLBACK stripped')
    .trim();
  console.log(`Applying: ${file}`);
  const { error } = await runQuery(sql);
  if (error) { console.error(`❌ Failed: ${error}`); process.exit(1); }
  console.log(`✅ Applied: ${file}`);
}

const files = process.argv.slice(2);
if (files.length === 0) { console.error('Usage: tsx _apply-migrations-api.ts <file> [file...]'); process.exit(1); }

(async () => {
  for (const f of files) await applyFile(f);
  console.log('\nDone.');
})().catch(e => { console.error(e.message); process.exit(1); });
