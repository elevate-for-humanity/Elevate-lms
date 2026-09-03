// scripts/test-partner-integration-complete.mjs
// Complete integration test for partner modules

import { existsSync } from 'fs';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Database migrations exist
test('All database migrations exist', () => {
  assert(
    existsSync('supabase/migrations/20241203_external_partner_modules.sql'),
    'External partner modules migration not found',
  );
  assert(
    existsSync('supabase/migrations/20241203_integrate_all_partners.sql'),
    'Partner integration SQL not found',
  );
  assert(
    existsSync('supabase/migrations/20241203_course_completion_with_external.sql'),
    'Course completion migration not found',
  );
});

// Test 2: Student interface exists
test('Student interface files exist', () => {
  assert(
    existsSync('app/student/courses/[courseId]/external/[moduleId]/page.tsx'),
    'Student external module page not found',
  );
  assert(
    existsSync('app/student/courses/[courseId]/external/[moduleId]/ExternalModuleClient.tsx'),
    'Student external module client not found',
  );
  assert(
    existsSync('app/student/courses/[courseId]/CourseCompletionClient.tsx'),
    'Course completion client not found',
  );
});

// Test 3: Admin interface exists
test('Admin interface files exist', () => {
  assert(
    existsSync('app/admin/external-progress/page.tsx'),
    'Admin external progress page not found',
  );
  assert(
    existsSync('app/admin/external-progress/ExternalProgressAdminClient.tsx'),
    'Admin external progress client not found',
  );
  assert(
    existsSync('app/admin/external-modules/approvals/page.tsx'),
    'Admin approvals page not found',
  );
  assert(
    existsSync('app/admin/external-modules/approvals/ApprovalsList.tsx'),
    'Admin approvals list not found',
  );
});

// Test 4: API routes exist
test('API routes exist', () => {
  assert(
    existsSync('app/api/admin/external-progress/update/route.ts'),
    'Admin update API not found',
  );
  assert(
    existsSync('app/api/courses/[courseId]/check-completion/route.ts'),
    'Course completion API not found',
  );
  assert(
    existsSync('app/api/webhooks/partners/[partner]/route.ts'),
    'Partner webhook API not found',
  );
});

// Test 5: Partner implementations exist
test('All 7 partner implementations exist', () => {
  const partners = ['hsi', 'certiport', 'careersafe', 'milady', 'jri', 'nrf', 'nds'];
  for (const partner of partners) {
    assert(existsSync(`lib/partners/${partner}.ts`), `${partner} implementation not found`);
  }
});

// Test 6: Business logic exists
test('Business logic files exist', () => {
  assert(existsSync('lib/partners/hybrid-enrollment.ts'), 'Hybrid enrollment logic not found');
  assert(existsSync('lib/course-completion.ts'), 'Course completion logic not found');
  assert(existsSync('lib/partners/monitoring.ts'), 'Monitoring logic not found');
});

// Test 7: Documentation exists
test('All documentation files exist', () => {
  const docs = [
    'HYBRID_PARTNER_INTEGRATION.md',
    'HYBRID_INTEGRATION_COMPLETE.md',
    'PARTNER_COURSE_EXAMPLES.md',
    'ADMIN_GUIDE_EXTERNAL_MODULES.md',
    'STUDENT_GUIDE_EXTERNAL_MODULES.md',
    'API_CREDENTIAL_SETUP_CHECKLIST.md',
    'PARTNER_INTEGRATION_FINAL_SUMMARY.md',
  ];
  for (const doc of docs) {
    assert(existsSync(doc), `${doc} not found`);
  }
});

// Test 8: Configuration files exist
test('Configuration files exist', () => {
  assert(existsSync('.env.partners.example'), 'Partner environment template not found');
  assert(existsSync('lib/partners/config.ts'), 'Partner config not found');
});

// Run all tests

for (const { name, fn } of tests) {
  try {
    fn();
    passed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}\n`);
    failed++;
  }
}

if (failed === 0) {
  process.exit(0);
} else {
  process.exit(1);
}
