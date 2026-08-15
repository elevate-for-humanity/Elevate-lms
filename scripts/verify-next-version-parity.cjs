/**
 * scripts/verify-next-version-parity.cjs
 *
 * Fails the build if a deployed Next.js application declares a different
 * Next.js version from the other deployed applications.
 *
 * The repository root is an orchestration/tooling package, not a deployed
 * Next.js runtime. Staged/non-workspace applications are intentionally not
 * part of the production parity contract.
 */

const fs = require('fs');

const files = [
  'apps/admin/package.json',
  'apps/lms/package.json',
  'apps/marketing/package.json',
].filter((f) => fs.existsSync(f));

const versions = [];

for (const file of files) {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nextVersion = pkg.dependencies?.next ?? pkg.devDependencies?.next ?? null;
  if (nextVersion) versions.push({ file, nextVersion });
}

const distinct = [...new Set(versions.map(({ nextVersion }) => nextVersion))];

console.log(JSON.stringify({ versions, distinct }, null, 2));

if (versions.length !== files.length) {
  console.error('Next.js version declaration missing from one or more deployed apps.');
  process.exit(1);
}

if (distinct.length !== 1) {
  console.error(
    `Next.js version drift detected across deployed apps: ${distinct.join(', ')}`,
  );
  process.exit(1);
}

console.log(`PASS: All deployed apps use Next.js ${distinct[0]}`);
