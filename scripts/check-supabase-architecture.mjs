import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SURFACE_ROOTS = ['apps', 'components'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const failures = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.next') return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

for (const surfaceRoot of SURFACE_ROOTS) {
  for (const absolute of walk(path.join(ROOT, surfaceRoot))) {
    if (!EXTENSIONS.has(path.extname(absolute))) continue;
    if (absolute.endsWith('.d.ts')) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    const relative = path.relative(ROOT, absolute);
    const runtimePackageImport = /^import\s+(?!type\b)[^;]+from\s+['"]@supabase\/(?:ssr|supabase-js)['"];?/m;
    const dynamicPackageImport = /import\(\s*['"]@supabase\/(?:ssr|supabase-js)['"]\s*\)/;
    const directConnectionEnv = /process\.env\.NEXT_PUBLIC_SUPABASE_(?:URL|ANON_KEY)/;

    if (runtimePackageImport.test(source) || dynamicPackageImport.test(source)) {
      failures.push(`${relative}: imports a Supabase runtime directly; use the canonical lib/supabase boundary`);
    }
    const header = source.slice(0, 512);
    if (/^\s*['"]use client['"];?/m.test(header) && directConnectionEnv.test(source)) {
      failures.push(`${relative}: reads Supabase connection env directly; use the canonical client`);
    }
  }
}

const requiredBoundaries = [
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/supabase/admin.ts',
  'lib/supabase/middleware.ts',
  'lib/api/auth/shared-route-handlers.ts',
];

for (const relative of requiredBoundaries) {
  if (!fs.existsSync(path.join(ROOT, relative))) {
    failures.push(`${relative}: required canonical Supabase boundary is missing`);
  }
}

const requiredSharedConsumers = [
  ['apps/admin/middleware.ts', 'createMiddlewareSupabaseClient'],
  ['apps/lms/middleware.ts', 'createMiddlewareSupabaseClient'],
  ['apps/marketing/middleware.ts', 'createMiddlewareSupabaseClient'],
  ['apps/lms/app/auth/callback/route.ts', 'handleOAuthCallback'],
  ['apps/marketing/app/auth/callback/route.ts', 'handleOAuthCallback'],
  ['apps/lms/app/api/auth/landing/route.ts', 'getAuthLanding'],
  ['apps/marketing/app/api/auth/landing/route.ts', 'getAuthLanding'],
];

for (const [relative, requiredSymbol] of requiredSharedConsumers) {
  const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  if (!source.includes(requiredSymbol)) {
    failures.push(`${relative}: must delegate to ${requiredSymbol}`);
  }
}

if (failures.length) {
  console.error('Supabase architecture gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'Supabase architecture verified: browser, server, admin, middleware, and shared-auth boundaries are enforced across all applications.',
);
