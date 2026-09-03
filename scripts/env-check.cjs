/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Simple environment validation for CI
const required = {
  JWT_SECRET: { minLength: 16, description: 'JWT signing secret' },
};

const optional = {
  DATABASE_URL: { description: 'Database connection string' },
  STRIPE_SECRET_KEY: { description: 'Stripe payment processing key' },
  NODE_ENV: { description: 'Application environment', default: 'development' },
  LOG_LEVEL: { description: 'Logging level', default: 'info' },
};

function validateEnv() {
  let hasErrors = false;

  console.log('🔍 Validating environment variables...\n');

  // Check required variables
  for (const [key, config] of Object.entries(required)) {
    const value = process.env[key];
    if (!value) {
      console.error(`❌ Required variable ${key} is missing`);
      console.error(`   Description: ${config.description}\n`);
      hasErrors = true;
    } else if (config.minLength && value.length < config.minLength) {
      console.error(
        `❌ Variable ${key} is too short (${value.length} chars, minimum ${config.minLength})`,
      );
      console.error(`   Description: ${config.description}\n`);
      hasErrors = true;
    } else {
      console.log(`✅ ${key}: configured (${value.length} chars)`);
    }
  }

  // Check optional variables
  for (const [key, config] of Object.entries(optional)) {
    const value = process.env[key];
    if (value) {
      console.log(`✅ ${key}: configured`);
    } else {
      console.log(`ℹ️  ${key}: not set (optional) - ${config.description}`);
    }
  }

  if (hasErrors) {
    console.error('\n❌ Environment validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ Environment variables validated successfully');
  }
}

validateEnv();
