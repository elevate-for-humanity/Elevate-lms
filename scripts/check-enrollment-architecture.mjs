import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const roots = ['apps', 'lib', 'components', 'scripts'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const failures = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.next') return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

for (const sourceRoot of roots) {
  for (const absolute of walk(path.join(root, sourceRoot))) {
    if (!extensions.has(path.extname(absolute))) continue;
    if (absolute.endsWith('check-enrollment-architecture.mjs')) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    if (/student_enrollments/.test(source)) {
      failures.push(`${path.relative(root, absolute)}: references the retired enrollment table`);
    }
  }
}

for (const migration of [
  'supabase/migrations/20260816000001_prepare_canonical_program_enrollments.sql',
  'supabase/migrations/20260816000002_retire_student_enrollments.sql',
]) {
  if (!fs.existsSync(path.join(root, migration))) {
    failures.push(`${migration}: required consolidation migration is missing`);
  }
}

if (failures.length) {
  console.error('Enrollment architecture gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'Enrollment architecture verified: program_enrollments is the only active enrollment authority.',
);
