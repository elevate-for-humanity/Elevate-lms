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
    const source = fs.readFileSync(absolute, 'utf8');
    const header = source.slice(0, 512);
    if (!/^\s*['"]use client['"];?/m.test(header)) continue;

    const relative = path.relative(ROOT, absolute);
    const runtimePackageImport = /^import\s+(?!type\b)[^;]+from\s+['"]@supabase\/(?:ssr|supabase-js)['"];?/m;
    const dynamicPackageImport = /import\(\s*['"]@supabase\/(?:ssr|supabase-js)['"]\s*\)/;
    const directConnectionEnv = /process\.env\.NEXT_PUBLIC_SUPABASE_(?:URL|ANON_KEY)/;

    if (runtimePackageImport.test(source) || dynamicPackageImport.test(source)) {
      failures.push(`${relative}: imports a Supabase runtime directly; use @/lib/supabase/client`);
    }
    if (directConnectionEnv.test(source)) {
      failures.push(`${relative}: reads Supabase connection env directly; use the canonical client`);
    }
  }
}

const requiredBoundaries = [
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/supabase/admin.ts',
  'lib/api/auth/shared-route-handlers.ts',
];

for (const relative of requiredBoundaries) {
  if (!fs.existsSync(path.join(ROOT, relative))) {
    failures.push(`${relative}: required canonical Supabase boundary is missing`);
  }
}

if (failures.length) {
  console.error('Supabase architecture gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'Supabase architecture verified: client surfaces use one browser boundary; server, admin, and auth boundaries are present.',
);
