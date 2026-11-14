#!/usr/bin/env tsx
/**
 * Enrollment Flow Validation
 * Checks that enrollment-related code and types are properly wired
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Validating enrollment flow...\n');

const ENROLLMENT_FILES = [
  // Types
  { path: 'types/enrollment.ts', description: 'Enrollment types' },

  // API routes
  { path: 'app/api/enrollments/route.ts', description: 'Enrollments API' },
  { path: 'app/api/apply/route.ts', description: 'Application API' },

  // Pages
  { path: 'app/apply/page.tsx', description: 'Application page' },
  { path: 'app/enroll/page.tsx', description: 'Enrollment page' },

  // Components
  {
    path: 'components/enrollment/EnrollmentWizard.tsx',
    description: 'Enrollment wizard component',
  },

  // Lib
  { path: 'lib/enrollment', description: 'Enrollment utilities (directory)' },
];

let hasErrors = false;
const missing: string[] = [];
const present: string[] = [];

for (const file of ENROLLMENT_FILES) {
  const fullPath = path.join(process.cwd(), file.path);

  if (fs.existsSync(fullPath)) {
    present.push(`✅ ${file.description}`);
  } else {
    missing.push(`❌ ${file.description} (${file.path})`);
    hasErrors = true;
  }
}

// Check for enrollment-related database types
const dbTypesPath = path.join(process.cwd(), 'types/database.ts');
if (fs.existsSync(dbTypesPath)) {
  const content = fs.readFileSync(dbTypesPath, 'utf8');

  const requiredTypes = ['EnrollmentStatus', 'FundingType'];

  for (const type of requiredTypes) {
    if (content.includes(type)) {
      present.push(`✅ Database type: ${type}`);
    } else {
      missing.push(`⚠️  Database type missing: ${type}`);
    }
  }
}

// Report results
console.log('Enrollment flow validation:\n');

if (present.length > 0) {
  console.log('Present components:');
  present.forEach((msg) => console.log(`   ${msg}`));
  console.log();
}

if (missing.length > 0) {
  console.log('Missing components:');
  missing.forEach((msg) => console.log(`   ${msg}`));
  console.log();
}

if (hasErrors) {
  console.log('❌ Enrollment validation FAILED');
  console.log('   Critical enrollment components missing\n');
  process.exit(1);
} else {
  console.log('✅ Enrollment validation PASSED');
  console.log('   All enrollment components present\n');
  process.exit(0);
}
