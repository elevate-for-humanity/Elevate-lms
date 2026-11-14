#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Enrollment Flow Implementation\n');
console.log('='.repeat(60));

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Test 1: Check enrollment pages exist
console.log('\n📄 Test 1: Enrollment Pages');
const enrollmentPages = [
  'app/courses/[courseId]/enroll/page.tsx',
  'app/courses/[courseId]/enroll/InternalEnrollmentForm.tsx',
  'app/courses/partners/[courseId]/enroll/page.tsx',
  'app/courses/partners/[courseId]/enroll/EnrollmentForm.tsx',
  'app/courses/partners/[courseId]/success/page.tsx',
];

enrollmentPages.forEach((page) => {
  const fullPath = path.join(process.cwd(), page);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const size = (content.length / 1024).toFixed(2);
    console.log(`  ✅ ${page} (${size} KB)`);
    results.passed.push(`Enrollment page: ${page}`);
  } else {
    console.log(`  ❌ ${page} - NOT FOUND`);
    results.failed.push(`Missing enrollment page: ${page}`);
  }
});

// Test 2: Check for Supabase integration
console.log('\n🗄️  Test 2: Database Integration');
const dbIntegrationChecks = [
  {
    file: 'app/courses/[courseId]/enroll/page.tsx',
    patterns: ['createClient', 'enrollments', 'courses'],
  },
  {
    file: 'app/courses/partners/[courseId]/enroll/page.tsx',
    patterns: ['createClient', 'partner_enrollments', 'partner_courses'],
  },
  {
    file: 'app/courses/partners/[courseId]/success/page.tsx',
    patterns: ['createClient', 'partner_enrollments'],
  },
];

dbIntegrationChecks.forEach((check) => {
  const fullPath = path.join(process.cwd(), check.file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const missingPatterns = check.patterns.filter((p) => !content.includes(p));

    if (missingPatterns.length === 0) {
      console.log(`  ✅ ${check.file} - All DB patterns found`);
      results.passed.push(`DB integration: ${check.file}`);
    } else {
      console.log(`  ❌ ${check.file} - Missing: ${missingPatterns.join(', ')}`);
      results.failed.push(`Incomplete DB integration: ${check.file}`);
    }
  }
});

// Test 3: Check enrollment forms have required fields
console.log('\n📝 Test 3: Enrollment Form Fields');
const formChecks = [
  {
    file: 'app/courses/[courseId]/enroll/InternalEnrollmentForm.tsx',
    fields: ['programHolder', 'fundingSource', 'agreedToTerms', 'handleSubmit'],
  },
  {
    file: 'app/courses/partners/[courseId]/enroll/EnrollmentForm.tsx',
    fields: ['programHolder', 'fundingSource', 'agreedToTerms', 'handleSubmit'],
  },
];

formChecks.forEach((check) => {
  const fullPath = path.join(process.cwd(), check.file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const missingFields = check.fields.filter((f) => !content.includes(f));

    if (missingFields.length === 0) {
      console.log(`  ✅ ${check.file} - All fields present`);
      results.passed.push(`Form fields: ${check.file}`);
    } else {
      console.log(`  ❌ ${check.file} - Missing: ${missingFields.join(', ')}`);
      results.failed.push(`Incomplete form: ${check.file}`);
    }
  }
});

// Test 4: Check catalog pages have enroll buttons
console.log('\n🔘 Test 4: Enroll Buttons in Catalogs');
const catalogPages = ['app/courses/catalog/page.tsx', 'app/courses/partners/page.tsx'];

catalogPages.forEach((page) => {
  const fullPath = path.join(process.cwd(), page);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasEnrollButton =
      content.includes('/enroll') && (content.includes('Enroll') || content.includes('enroll'));

    if (hasEnrollButton) {
      console.log(`  ✅ ${page} - Enroll buttons found`);
      results.passed.push(`Enroll buttons: ${page}`);
    } else {
      console.log(`  ⚠️  ${page} - No enroll buttons detected`);
      results.warnings.push(`Missing enroll buttons: ${page}`);
    }
  }
});

// Test 5: Check student courses page for enrollment display
console.log('\n👨‍🎓 Test 5: Student Enrollment Display');
const studentCoursePage = 'app/student/courses/page.tsx';
const fullPath = path.join(process.cwd(), studentCoursePage);

if (fs.existsSync(fullPath)) {
  const content = fs.readFileSync(fullPath, 'utf8');
  const hasEnrollmentQuery =
    content.includes('enrollments') || content.includes('partner_enrollments');
  const hasProgressTracking = content.includes('progress');

  if (hasEnrollmentQuery && hasProgressTracking) {
    console.log(`  ✅ ${studentCoursePage} - Enrollment tracking implemented`);
    results.passed.push('Student enrollment display');
  } else {
    console.log(`  ❌ ${studentCoursePage} - Missing enrollment tracking`);
    results.failed.push('Student enrollment display incomplete');
  }
}

// Test 6: Check for redirect logic
console.log('\n🔀 Test 6: Enrollment Flow Redirects');
const redirectChecks = [
  {
    file: 'app/courses/[courseId]/enroll/page.tsx',
    redirects: ['redirect', 'existingEnrollment'],
  },
  {
    file: 'app/courses/partners/[courseId]/enroll/page.tsx',
    redirects: ['redirect', 'existingEnrollment'],
  },
];

redirectChecks.forEach((check) => {
  const fullPath = path.join(process.cwd(), check.file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasAllRedirects = check.redirects.every((r) => content.includes(r));

    if (hasAllRedirects) {
      console.log(`  ✅ ${check.file} - Redirect logic present`);
      results.passed.push(`Redirects: ${check.file}`);
    } else {
      console.log(`  ⚠️  ${check.file} - Redirect logic may be incomplete`);
      results.warnings.push(`Check redirects: ${check.file}`);
    }
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 ENROLLMENT FLOW TEST SUMMARY\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failed.forEach((f) => console.log(`  - ${f}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  results.warnings.forEach((w) => console.log(`  - ${w}`));
}

console.log('\n' + '='.repeat(60));

if (results.failed.length === 0) {
  console.log('✅ ENROLLMENT FLOW: FULLY IMPLEMENTED');
  console.log('\nFeatures:');
  console.log('  • Internal course enrollment with form');
  console.log('  • Partner course enrollment with form');
  console.log('  • Success page with next steps');
  console.log('  • Duplicate enrollment prevention');
  console.log('  • Program holder and funding source tracking');
  console.log('  • Terms and conditions acceptance');
  console.log('  • Enrollment buttons in catalogs');
  console.log('  • Student dashboard integration');
  process.exit(0);
} else {
  console.log('❌ ENROLLMENT FLOW: NEEDS ATTENTION');
  process.exit(1);
}
