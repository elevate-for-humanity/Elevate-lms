/**
 * scripts/verify-next-version-parity.cjs
 *
 * Fails the build if any Next.js version declaration differs across workspaces.
 * Must pass before any production build.
 */

const fs = require('fs');

const files = [
  'package.json',
  'apps/package.json',
  'apps/admin/package.json',
  'apps/lms/package.json',
  'apps/marketing/package.json',
].filter((f) => fs.existsSync(f));

const versions = [];

for (const file of files) {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

  const nextVersion =
    pkg.dependencies?.next ?? pkg.devDependencies?.next ?? null;

  if (nextVersion) {
    versions.push({ file, nextVersion });
  }
}

const distinct = [...new Set(versions.map(({ nextVersion }) => nextVersion))];

console.log(JSON.stringify({ versions, distinct }, null, 2));

if (distinct.length !== 1) {
  console.error(
    `Next.js version drift detected across ${distinct.length} different versions: ${distinct.join(', ')}`,
  );
  process.exit(1);
}

console.log(`PASS: All workspaces use Next.js ${distinct[0]}`);
