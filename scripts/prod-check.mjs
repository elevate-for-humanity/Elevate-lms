import { execSync } from 'node:child_process';

const steps = [
  ['Lint', 'npm run lint'],
  ['Typecheck', 'npm run typecheck'],
  ['Tests', 'npm run test'],
  ['Build', 'npm run build'],
  ['Size', 'npm run size:check'],
  ['Audit', 'npm run security:audit'],
];

let failed = false;
for (const [name, cmd] of steps) {
  process.stdout.write(`→ ${name}... `);
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    failed = true;
  }
}
if (failed) {
  console.error('✗ Production check failed');
  process.exit(1);
} else {
}
