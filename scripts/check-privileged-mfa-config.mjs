import fs from 'node:fs';

const sourcePath = 'lib/auth/privileged-mfa.ts';
const envPath = '.env.example';

const source = fs.readFileSync(sourcePath, 'utf8');
const env = fs.readFileSync(envPath, 'utf8');

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

if (!source.includes("process.env.REQUIRE_PRIVILEGED_MFA === 'true'")) {
  console.error('FAIL: canonical REQUIRE_PRIVILEGED_MFA rollout switch missing.');
  process.exit(1);
}

if (!env.includes('REQUIRE_PRIVILEGED_MFA=')) {
  console.error('FAIL: REQUIRE_PRIVILEGED_MFA is undocumented in .env.example.');
  process.exit(1);
}

const productionRuntime = process.env.NODE_ENV === 'production' || process.env.DEPLOYMENT_ENV === 'production' || process.env.PRODUCTION_RUNTIME_CONFIG === 'true';
if (productionRuntime && process.env.REQUIRE_PRIVILEGED_MFA !== 'true') {
  console.error('FAIL: production runtime must set REQUIRE_PRIVILEGED_MFA=true.');
  process.exit(1);
}

console.log('OK: privileged MFA architecture covers canonical admin roles and requires AAL2.');
if (!productionRuntime) console.log('INFO: runtime enforcement value is checked when the gate runs in a production context.');
