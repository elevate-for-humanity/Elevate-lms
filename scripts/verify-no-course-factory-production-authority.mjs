import fs from 'node:fs';
import path from 'node:path';
const failures = [];
if (fs.existsSync('lib/course-factory/factory.ts')) failures.push('Superseded Course Factory engine remains deployable');
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx|js|mjs)$/.test(file)) {
      const source = fs.readFileSync(file, 'utf8');
      if (/(?:from|import\s*\()[^\n]*['"][^'"]*course-factory\/factory['"]/.test(source))
        failures.push(`${file}: imports removed generation engine`);
    }
  }
}
for (const dir of ['apps/admin/app/api', 'lib/jobs', 'lib/course-builder']) walk(dir);
for (const file of ['apps/admin/app/api/admin/course-builder/route.ts', 'lib/jobs/handlers/course-build.ts', 'lib/course-builder/orchestrator.ts']) {
  if (!fs.readFileSync(file, 'utf8').includes('requestCanonicalGeneration'))
    failures.push(`${file}: does not delegate production generation to Ultimate`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Ultimate production authority boundary: PASS');
