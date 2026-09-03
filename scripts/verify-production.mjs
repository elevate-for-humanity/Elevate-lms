#!/usr/bin/env node

// Production Readiness Verification Script
// Runs comprehensive checks to ensure the system is production-ready

import fs from 'fs';


const allChecks = [];
let passedChecks = 0;

function check(name, condition, message = '') {
  allChecks.push({ name, passed: condition, message });
  if (condition) {
    passedChecks++;
  } else {
  }
}

async function runChecks() {
  // Server architecture checks
  check(
    'Unified server exists',
    fs.existsSync('./server/main.ts'),
    'server/main.ts file present'
  );
  check('Auth middleware exists', fs.existsSync('./server/middleware/auth.ts'));
  check('Health router exists', fs.existsSync('./server/routes/health.ts'));
  check('LMS router exists', fs.existsSync('./server/routes/lms.ts'));
  check(
    'Compliance router exists',
    fs.existsSync('./server/routes/compliance.ts')
  );
  check('Payment router exists', fs.existsSync('./server/routes/payments.ts'));
  check(
    'Database service exists',
    fs.existsSync('./server/services/database.ts')
  );

  // Documentation checks
  check(
    'README updated',
    fs.existsSync('./README.md') &&
      fs
        .readFileSync('./README.md', 'utf8')
        .includes('Production Hardening Checklist')
  );
  check('Migration docs exist', fs.existsSync('./MIGRATIONS.md'));
  check('Compliance docs exist', fs.existsSync('./COMPLIANCE.md'));

  // CI/CD checks
  check('GitHub Actions workflow', fs.existsSync('./.github/workflows/ci.yml'));

  // Test files
  check('Unified server tests', fs.existsSync('./test/unified-server.test.ts'));
  check('Legacy tests preserved', fs.existsSync('./test/api.test.js'));

  // Dependencies check
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    check('Express installed', 'express' in deps);
    check('Prisma installed', '@prisma/client' in deps);
    check('Security middleware', 'helmet' in deps && 'compression' in deps);
    check('Logging framework', 'pino' in deps && 'pino-http' in deps);
    check('Stripe integration', 'stripe' in deps);
    check('Testing framework', 'vitest' in deps && 'supertest' in deps);
  } catch (error) {
    check('Package dependencies', false, error.message);
  }

  // Environment file check
  check('Environment example', fs.existsSync('./.env.example'));
  const envExample = fs.readFileSync('./.env.example', 'utf8');
  check(
    'JWT secret placeholder',
    envExample.includes('JWT_SECRET=') &&
      envExample.includes('minimum_32_characters')
  );

  // Configuration files
  check('TypeScript config', fs.existsSync('./tsconfig.json'));
  check('Package.json scripts', fs.existsSync('./package.json'));

  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    check('Build script exists', 'build' in packageJson.scripts);
    check('Test script exists', 'test' in packageJson.scripts);
    check('Lint script exists', 'lint' in packageJson.scripts);
    check('Env check script exists', 'env:check' in packageJson.scripts);
  } catch (error) {
    check('Package.json validation', false, error.message);
  }

  // Simple server functionality test
  try {
    // Check that legacy server file exists and is readable
    check(
      'Legacy server compatibility',
      fs.existsSync('./simple-server.cjs'),
      'simple-server.cjs exists for backward compatibility'
    );
  } catch (error) {
    check('Legacy server compatibility', false, error.message);
  }

  // Summary
    `\n📊 Summary: ${passedChecks}/${allChecks.length} checks passed`
  );

  if (passedChecks === allChecks.length) {
    process.exit(0);
  } else {
    allChecks
      .filter((c) => !c.passed)
      .forEach((c) => {
      });
    process.exit(1);
  }
}

runChecks().catch(console.error);
