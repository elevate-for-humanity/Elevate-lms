/**
 * Migrates all files off deprecated Supabase shims to canonical imports.
 *
 * Shim → canonical mapping:
 *   supabaseAdmin (object)       → createAdminClient() from '@/lib/supabase/admin'
 *   supabaseServer()             → createAdminClient() from '@/lib/supabase/admin'
 *   createSupabaseClient()       → createAdminClient() from '@/lib/supabase/admin'
 *   getSupabaseServerClient()    → createAdminClient() from '@/lib/supabase/admin'
 *   getServerSupabase()          → createAdminClient() from '@/lib/supabase/admin'
 *   getAdminSupabase()           → createAdminClient() from '@/lib/supabase/admin'
 *   getClientSupabase()          → createBrowserClient() from '@/lib/supabase/client'
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = execSync(
  `grep -rl "from '@/lib/supabaseAdmin'\\|from '@/lib/supabase-admin'\\|from '@/lib/supabaseServer'\\|from '@/lib/supabase-server'\\|from '@/lib/supabaseClient'\\|from '@/lib/supabaseClients'\\|from '@/lib/supabase-api'\\|from '@/lib/getSupabaseServerClient'\\|from '@/lib/supabase-lazy'" app --include="*.ts" --include="*.tsx"`,
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

console.log(`Fixing ${files.length} files...`);

let fixed = 0;
for (const file of files) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // ── 1. Remove all deprecated import lines ──────────────────────────────
  src = src.replace(/^import\s+\{[^}]+\}\s+from\s+'@\/lib\/(supabaseAdmin|supabase-admin|supabaseServer|supabase-server|supabaseClient|supabaseClients|supabase-api|getSupabaseServerClient|supabase-lazy)';\n?/gm, '');
  src = src.replace(/^import\s+\*\s+as\s+\w+\s+from\s+'@\/lib\/(supabaseAdmin|supabase-admin|supabaseServer|supabase-server|supabaseClient|supabaseClients|supabase-api|getSupabaseServerClient|supabase-lazy)';\n?/gm, '');

  // ── 2. Add canonical import if not already present ─────────────────────
  const needsAdmin = /supabaseAdmin\b|supabaseServer\(\)|createSupabaseClient\(\)|getSupabaseServerClient\(\)|getServerSupabase\(\)|getAdminSupabase\(\)/.test(src);
  const needsClient = /getClientSupabase\(\)/.test(src);

  const hasAdminImport = /from '@\/lib\/supabase\/admin'/.test(src);
  const hasClientImport = /from '@\/lib\/supabase\/client'/.test(src);

  if (needsAdmin && !hasAdminImport) {
    // Insert after the last existing import block
    src = src.replace(
      /^(import\s.+;\n)(?!import\s)/m,
      `$1import { createAdminClient } from '@/lib/supabase/admin';\n`
    );
  }
  if (needsClient && !hasClientImport) {
    src = src.replace(
      /^(import\s.+;\n)(?!import\s)/m,
      `$1import { createBrowserClient } from '@/lib/supabase/client';\n`
    );
  }

  // ── 3. Replace usage patterns ───────────────────────────────────────────

  // supabaseAdmin.from(... → const db = createAdminClient(); db.from(...
  // Handle: await supabaseAdmin.from / supabaseAdmin.from / supabaseAdmin.auth
  // Strategy: replace `supabaseAdmin` identifier with a local `db` variable,
  // and hoist `const db = createAdminClient();` into each function that uses it.

  // Simple identifier replacement — works for the vast majority of cases
  src = src.replace(/\bsupabaseAdmin\b/g, 'createAdminClient()');

  // supabaseServer() → createAdminClient()
  src = src.replace(/\bsupabaseServer\(\)/g, 'createAdminClient()');

  // createSupabaseClient() → createAdminClient()
  src = src.replace(/\bcreateSupabaseClient\(\)/g, 'createAdminClient()');

  // getSupabaseServerClient() → createAdminClient()
  src = src.replace(/\bgetSupabaseServerClient\(\)/g, 'createAdminClient()');

  // getServerSupabase() → createAdminClient()
  src = src.replace(/\bgetServerSupabase\(\)/g, 'createAdminClient()');

  // getAdminSupabase() → createAdminClient()
  src = src.replace(/\bgetAdminSupabase\(\)/g, 'createAdminClient()');

  // getClientSupabase() → createBrowserClient()
  src = src.replace(/\bgetClientSupabase\(\)/g, 'createBrowserClient()');

  if (src !== original) {
    writeFileSync(file, src);
    console.log(`  ✅ ${file}`);
    fixed++;
  } else {
    console.log(`  ⏭  ${file} (no changes needed)`);
  }
}

console.log(`\nDone. Fixed ${fixed}/${files.length} files.`);
