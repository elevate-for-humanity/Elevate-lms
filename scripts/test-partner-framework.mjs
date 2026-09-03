// scripts/test-partner-framework.mjs
// Quick test to verify partner framework is working

// Test 1: Check if all partner files exist
import { existsSync } from 'fs';

const partnerFiles = [
  'lib/partners/base.ts',
  'lib/partners/http-client.ts',
  'lib/partners/config.ts',
  'lib/partners/monitoring.ts',
  'lib/partners/index.ts',
  'lib/partners/hsi.ts',
  'lib/partners/certiport.ts',
  'lib/partners/careersafe.ts',
  'lib/partners/milady.ts',
  'lib/partners/jri.ts',
  'lib/partners/nrf.ts',
  'lib/partners/nds.ts',
];

let allFilesExist = true;
for (const file of partnerFiles) {
  if (!existsSync(file)) {
    console.error(`   ❌ Missing: ${file}`);
    allFilesExist = false;
  } else {
  }
}

if (allFilesExist) {
} else {
  console.error('   ❌ Some files are missing\n');
  process.exit(1);
}

// Test 2: Check webhook handler
if (existsSync('app/api/webhooks/partners/[partner]/route.ts')) {
} else {
  console.error('   ❌ Webhook handler missing\n');
  process.exit(1);
}

// Test 3: Check documentation
const docFiles = [
  'PARTNER_INTEGRATION_FRAMEWORK.md',
  'PARTNER_API_IMPLEMENTATION_GUIDE.md',
  'PARTNER_INTEGRATION_COMPLETE.md',
  'PARTNER_INTEGRATION_SUMMARY.md',
  'PARTNER_CONTACTS.md',
  'PARTNER_INTEGRATION_QUICK_START.md',
  '.env.partners.example',
];

let allDocsExist = true;
for (const file of docFiles) {
  if (!existsSync(file)) {
    console.error(`   ❌ Missing: ${file}`);
    allDocsExist = false;
  } else {
  }
}

if (allDocsExist) {
} else {
  console.error('   ❌ Some documentation is missing\n');
  process.exit(1);
}

// Test 4: Check environment template
import { readFileSync } from 'fs';

const envTemplate = readFileSync('.env.partners.example', 'utf-8');
const requiredVars = [
  'HSI_API_BASE_URL',
  'CERTIPORT_API_BASE_URL',
  'CAREERSAFE_API_BASE_URL',
  'MILADY_API_BASE_URL',
  'JRI_API_BASE_URL',
  'NRF_API_BASE_URL',
  'NDS_API_BASE_URL',
];

let allVarsPresent = true;
for (const varName of requiredVars) {
  if (!envTemplate.includes(varName)) {
    console.error(`   ❌ Missing: ${varName}`);
    allVarsPresent = false;
  } else {
  }
}

if (allVarsPresent) {
} else {
  console.error('   ❌ Some environment variables missing\n');
  process.exit(1);
}

// Summary
