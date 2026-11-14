// scripts/test-hybrid-integration.mjs
// Test script for hybrid partner integration

import { existsSync } from 'fs';
import { readFileSync } from 'fs';

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

// Test 1: Database migration exists
test('Database migration file exists', () => {
  assert(
    existsSync('supabase/migrations/20241203_external_partner_modules.sql'),
    'Migration file not found',
  );
});

// Test 2: Migration has required tables
test('Migration creates required tables', () => {
  const migration = readFileSync(
    'supabase/migrations/20241203_external_partner_modules.sql',
    'utf-8',
  );
  assert(
    migration.includes('external_partner_modules'),
    'external_partner_modules table not found',
  );
  assert(
    migration.includes('external_partner_progress'),
    'external_partner_progress table not found',
  );
  assert(migration.includes('external_module_status'), 'external_module_status enum not found');
  assert(migration.includes('partner_delivery_mode'), 'partner_delivery_mode enum not found');
});

// Test 3: Student interface files exist
test('Student interface files exist', () => {
  assert(
    existsSync('app/student/courses/[courseId]/external/[moduleId]/page.tsx'),
    'Student page not found',
  );
  assert(
    existsSync('app/student/courses/[courseId]/external/[moduleId]/ExternalModuleClient.tsx'),
    'Student client component not found',
  );
});

// Test 4: Admin interface files exist
test('Admin interface files exist', () => {
  assert(existsSync('app/admin/external-modules/approvals/page.tsx'), 'Admin page not found');
  assert(
    existsSync('app/admin/external-modules/approvals/ApprovalsList.tsx'),
    'Admin list component not found',
  );
});

// Test 5: Hybrid enrollment logic exists
test('Hybrid enrollment logic exists', () => {
  assert(existsSync('lib/partners/hybrid-enrollment.ts'), 'Hybrid enrollment file not found');
  const content = readFileSync('lib/partners/hybrid-enrollment.ts', 'utf-8');
  assert(content.includes('enrollInExternalModule'), 'enrollInExternalModule function not found');
  assert(
    content.includes('syncExternalModuleProgress'),
    'syncExternalModuleProgress function not found',
  );
  assert(content.includes('enrollViaAPI'), 'enrollViaAPI function not found');
  assert(content.includes('enrollViaLink'), 'enrollViaLink function not found');
});

// Test 6: Course completion logic exists
test('Course completion logic exists', () => {
  assert(existsSync('lib/course-completion.ts'), 'Course completion file not found');
  const content = readFileSync('lib/course-completion.ts', 'utf-8');
  assert(content.includes('checkCourseCompletion'), 'checkCourseCompletion function not found');
  assert(content.includes('completeCourse'), 'completeCourse function not found');
  assert(content.includes('getCourseProgress'), 'getCourseProgress function not found');
  assert(content.includes('checkExternalModules'), 'checkExternalModules function not found');
});

// Test 7: Documentation exists
test('Documentation files exist', () => {
  assert(existsSync('HYBRID_PARTNER_INTEGRATION.md'), 'Hybrid integration docs not found');
  assert(existsSync('PARTNER_INTEGRATION_FRAMEWORK.md'), 'Framework docs not found');
  assert(existsSync('PARTNER_API_IMPLEMENTATION_GUIDE.md'), 'Implementation guide not found');
});

// Test 8: Student client supports all modes
test('Student client supports all delivery modes', () => {
  const content = readFileSync(
    'app/student/courses/[courseId]/external/[moduleId]/ExternalModuleClient.tsx',
    'utf-8',
  );
  assert(content.includes('delivery_mode'), 'delivery_mode not found');
  assert(content.includes('isApiMode'), 'API mode check not found');
  assert(content.includes('isLinkMode'), 'Link mode check not found');
  assert(content.includes('isHybridMode'), 'Hybrid mode check not found');
  assert(content.includes('proof_file_url'), 'Proof upload not found');
  assert(content.includes('progress_percentage'), 'API progress not found');
});

// Test 9: Admin interface has approval actions
test('Admin interface has approval actions', () => {
  const content = readFileSync('app/admin/external-modules/approvals/ApprovalsList.tsx', 'utf-8');
  assert(content.includes('handleApprove'), 'Approve handler not found');
  assert(content.includes('handleReject'), 'Reject handler not found');
  assert(content.includes('pendingSubmissions'), 'Pending submissions not found');
  assert(content.includes('recentlyApproved'), 'Recently approved not found');
});

// Test 10: Migration has RLS policies
test('Migration includes RLS policies', () => {
  const migration = readFileSync(
    'supabase/migrations/20241203_external_partner_modules.sql',
    'utf-8',
  );
  assert(migration.includes('enable row level security'), 'RLS not enabled');
  assert(migration.includes('students_can_view_course_modules'), 'Student view policy not found');
  assert(
    migration.includes('students_can_manage_own_progress'),
    'Student progress policy not found',
  );
  assert(migration.includes('admins_can_manage'), 'Admin policies not found');
});

// Test 11: Migration has helper functions
test('Migration includes helper functions', () => {
  const migration = readFileSync(
    'supabase/migrations/20241203_external_partner_modules.sql',
    'utf-8',
  );
  assert(migration.includes('auto_approve_api_completion'), 'Auto-approve function not found');
  assert(
    migration.includes('check_course_completion_with_external'),
    'Course completion check function not found',
  );
});

// Test 12: Hybrid enrollment handles both modes
test('Hybrid enrollment handles both API and link modes', () => {
  const content = readFileSync('lib/partners/hybrid-enrollment.ts', 'utf-8');
  assert(
    content.includes('delivery_mode === "api"') || content.includes("delivery_mode === 'api'"),
    'API mode check not found',
  );
  assert(
    content.includes('delivery_mode === "link"') || content.includes("delivery_mode === 'link'"),
    'Link mode check not found',
  );
  assert(
    content.includes('delivery_mode === "hybrid"') ||
      content.includes("delivery_mode === 'hybrid'"),
    'Hybrid mode check not found',
  );
  assert(
    content.includes('enrollViaAPI') && content.includes('enrollViaLink'),
    'Enrollment mode functions not found',
  );
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
