import fs from 'node:fs';
import path from 'node:path';

const roots = [
  'components/site',
  'apps/lms/app/login',
  'lib/auth',
  'lib/navigation.ts',
];

const forbidden = [
  'https://www.elevateforhumanity.org',
  'https://app.elevateforhumanity.org',
  'https://admin.elevateforhumanity.org',
];

function collect(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) return collect(full);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) ? [full] : [];
  });
}

const files = [...new Set(roots.flatMap(collect))];
const violations = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const literal of forbidden) {
    if (text.includes(literal)) violations.push(`${file}: ${literal}`);
  }
}

if (violations.length) {
  console.error('Hardcoded Elevate service URLs found in navigation/auth code:');
  for (const violation of violations) console.error(` - ${violation}`);
  console.error('Use lib/utils/site-urls.ts or lib/navigation/routes.ts instead.');
  process.exit(1);
}

console.log(`Navigation hardcoding guard passed (${files.length} files checked).`);
