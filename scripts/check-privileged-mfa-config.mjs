import fs from 'node:fs';

const sourcePath = 'lib/auth/privileged-mfa.ts';
const source = fs.readFileSync(sourcePath, 'utf8');

const requiredRoles = ['super_admin','admin','org_admin','provider_admin','workforce_board_admin'];
const missingRoles = requiredRoles.filter((role) => !source.includes(`'${role}'`));
if (missingRoles.length) {
  console.error(`FAIL: privileged MFA role coverage missing: ${missingRoles.join(', ')}`);
  process.exit(1);
}

if (!source.includes("currentLevel === 'aal2'")) {
  console.error('FAIL: privileged MFA does not enforce AAL2.');
  process.exit(1);
}

const invariantEnforcement =
  source.includes('export function privilegedMfaEnforcementEnabled()') &&
  /privilegedMfaEnforcementEnabled\(\)[\s\S]*?return\s+true\s*;/.test(source);

if (!invariantEnforcement) {
  console.error('FAIL: privileged MFA must be an unconditional production invariant.');
  process.exit(1);
}

if (source.includes("process.env.REQUIRE_PRIVILEGED_MFA") || source.includes('REQUIRE_PRIVILEGED_MFA ===')) {
  console.error('FAIL: privileged MFA must not be disableable through a rollout environment flag.');
  process.exit(1);
}

console.log('OK: privileged MFA covers canonical admin roles, requires AAL2, and cannot be disabled by runtime configuration.');
