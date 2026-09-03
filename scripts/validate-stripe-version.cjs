#!/usr/bin/env node

/**
 * Validates that all Stripe API versions are consistent
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_VERSION = '2024-11-20.acacia';
const DEPRECATED_VERSIONS = ['2023-10-16', '2025-10-29.clover'];

const filesToCheck = [
  'app/api/checkout/create/route.ts',
  'app/api/checkout/route.ts',
  'app/api/webhooks/stripe/route.ts',
  'app/api/stripe/route.ts',
  'app/api/stripe/webhook/route.ts',
  'app/api/create-checkout-session/route.ts',
  'app/api/hsi/create-checkout/route.ts',
  'app/api/partner-courses/create-checkout/route.ts',
  'lib/stripe/stripe-client.ts',
  'lib/payments.ts',
  'lib/billing/stripe.ts',
  'lib/partner-workflows/payments.ts',
];

let hasErrors = false;
const errors = [];

console.log('🔍 Validating Stripe API versions...\n');

filesToCheck.forEach((file) => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if file contains Stripe initialization
  if (content.includes('new Stripe(') && content.includes('apiVersion')) {
    // Extract API version
    const apiVersionMatch = content.match(/apiVersion:\s*['"]([^'"]+)['"]/);

    if (apiVersionMatch) {
      const version = apiVersionMatch[1];

      if (version !== EXPECTED_VERSION) {
        hasErrors = true;
        errors.push(`❌ ${file}: uses ${version} (expected ${EXPECTED_VERSION})`);
      } else {
        console.log(`✅ ${file}: ${version}`);
      }

      // Check for deprecated versions
      if (DEPRECATED_VERSIONS.includes(version)) {
        hasErrors = true;
        errors.push(`⚠️  ${file}: uses deprecated version ${version}`);
      }
    }
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('\n❌ Validation failed!\n');
  errors.forEach((error) => console.log(error));
  console.log('\nPlease update all Stripe API versions to:', EXPECTED_VERSION);
  process.exit(1);
} else {
  console.log('\n✅ All Stripe API versions are consistent!');
  console.log(`   Using version: ${EXPECTED_VERSION}`);
  process.exit(0);
}
