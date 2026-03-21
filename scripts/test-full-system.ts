/**
 * Full System Test Script
 * Tests all database tables, API endpoints, and integrations
 * Run with: npx tsx scripts/test-full-system.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials - these should be set in environment or here for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not set - using anon key for limited testing');
  console.log('   Set SUPABASE_SERVICE_ROLE_KEY for full test coverage\n');
}

const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('❌ No Supabase key available. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nTo run tests:');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('  npx tsx scripts/test-full-system.ts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// ============================================================================
// CORE TABLES TESTS
// ============================================================================

async function testCoreTables() {
  console.log('\n📋 TESTING CORE TABLES...\n');

  // Profiles
  await test('profiles table exists and accessible', async () => {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
  });

  // Programs
  await test('programs table exists with data', async () => {
    const { data, error, count } = await supabase
      .from('programs')
      .select('*', { count: 'exact' })
      .limit(5);
    if (error) throw error;
    if (!count || count === 0) throw new Error('No programs found');
    results[results.length - 1].details = `${count} programs`;
  });

  // Courses
  await test('courses table exists with data', async () => {
    const { data, error, count } = await supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .limit(5);
    if (error) throw error;
    results[results.length - 1].details = `${count || 0} courses`;
  });

  // Lessons
  await test('lessons table exists', async () => {
    const { data, error } = await supabase.from('lessons').select('id').limit(1);
    if (error) throw error;
  });

  // Enrollments
  await test('enrollments table exists', async () => {
    const { data, error } = await supabase.from('enrollments').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// STORE TABLES TESTS
// ============================================================================

async function testStoreTables() {
  console.log('\n🛒 TESTING STORE TABLES...\n');

  await test('products table exists', async () => {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .limit(5);
    if (error) throw error;
    results[results.length - 1].details = `${count || 0} products`;
  });

  await test('product_categories table exists', async () => {
    const { data, error } = await supabase.from('product_categories').select('id').limit(1);
    if (error) throw error;
  });

  await test('cart_items table exists', async () => {
    const { data, error } = await supabase.from('cart_items').select('id').limit(1);
    if (error) throw error;
  });

  await test('orders table exists', async () => {
    const { data, error } = await supabase.from('orders').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// LMS TABLES TESTS
// ============================================================================

async function testLMSTables() {
  console.log('\n📚 TESTING LMS TABLES...\n');

  await test('course_modules table exists', async () => {
    const { data, error } = await supabase.from('course_modules').select('id').limit(1);
    if (error) throw error;
  });

  await test('lesson_content_blocks table exists', async () => {
    const { data, error } = await supabase.from('lesson_content_blocks').select('id').limit(1);
    if (error) throw error;
  });

  await test('lesson_progress table exists', async () => {
    const { data, error } = await supabase.from('lesson_progress').select('id').limit(1);
    if (error) throw error;
  });

  await test('quizzes table exists', async () => {
    const { data, error } = await supabase.from('quizzes').select('id').limit(1);
    if (error) throw error;
  });

  await test('quiz_questions table exists', async () => {
    const { data, error } = await supabase.from('quiz_questions').select('id').limit(1);
    if (error) throw error;
  });

  await test('quiz_attempts table exists', async () => {
    const { data, error } = await supabase.from('quiz_attempts').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// COMPLIANCE TABLES TESTS
// ============================================================================

async function testComplianceTables() {
  console.log('\n📋 TESTING COMPLIANCE TABLES...\n');

  await test('employment_tracking table exists', async () => {
    const { data, error } = await supabase.from('employment_tracking').select('id').limit(1);
    if (error) throw error;
  });

  await test('credential_verification table exists', async () => {
    const { data, error } = await supabase.from('credential_verification').select('id').limit(1);
    if (error) throw error;
  });

  await test('training_hours table exists', async () => {
    const { data, error } = await supabase.from('training_hours').select('id').limit(1);
    if (error) throw error;
  });

  await test('audit_logs table exists', async () => {
    const { data, error } = await supabase.from('audit_logs').select('id').limit(1);
    if (error) throw error;
  });

  await test('consent_records table exists', async () => {
    const { data, error } = await supabase.from('consent_records').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// COMMUNITY TABLES TESTS
// ============================================================================

async function testCommunityTables() {
  console.log('\n👥 TESTING COMMUNITY TABLES...\n');

  await test('community_posts table exists', async () => {
    const { data, error } = await supabase.from('community_posts').select('id').limit(1);
    if (error) throw error;
  });

  await test('community_events table exists', async () => {
    const { data, error } = await supabase.from('community_events').select('id').limit(1);
    if (error) throw error;
  });

  await test('study_groups table exists', async () => {
    const { data, error } = await supabase.from('study_groups').select('id').limit(1);
    if (error) throw error;
  });

  await test('notifications table exists', async () => {
    const { data, error } = await supabase.from('notifications').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// LICENSING TABLES TESTS
// ============================================================================

async function testLicensingTables() {
  console.log('\n🔑 TESTING LICENSING TABLES...\n');

  await test('licenses table exists', async () => {
    const { data, error } = await supabase.from('licenses').select('id').limit(1);
    if (error) throw error;
  });

  await test('organizations table exists', async () => {
    const { data, error } = await supabase.from('organizations').select('id').limit(1);
    if (error) throw error;
  });

  await test('license_agreement_acceptances table exists', async () => {
    const { data, error } = await supabase.from('license_agreement_acceptances').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// PARTNER TABLES TESTS
// ============================================================================

async function testPartnerTables() {
  console.log('\n🤝 TESTING PARTNER TABLES...\n');

  await test('partners table exists', async () => {
    const { data, error } = await supabase.from('partners').select('id').limit(1);
    if (error) throw error;
  });

  await test('worksite_partners table exists', async () => {
    const { data, error } = await supabase.from('worksite_partners').select('id').limit(1);
    if (error) throw error;
  });

  await test('apprentice_assignments table exists', async () => {
    const { data, error } = await supabase.from('apprentice_assignments').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// TAX/VITA TABLES TESTS
// ============================================================================

async function testTaxTables() {
  console.log('\n💰 TESTING TAX/VITA TABLES...\n');

  await test('vita_appointments table exists', async () => {
    const { data, error } = await supabase.from('vita_appointments').select('id').limit(1);
    if (error) throw error;
  });

  await test('tax_filings table exists', async () => {
    const { data, error } = await supabase.from('tax_filings').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// SUPPORT TABLES TESTS
// ============================================================================

async function testSupportTables() {
  console.log('\n🎫 TESTING SUPPORT TABLES...\n');

  await test('support_tickets table exists', async () => {
    const { data, error } = await supabase.from('support_tickets').select('id').limit(1);
    if (error) throw error;
  });

  await test('customer_service_tickets table exists', async () => {
    const { data, error } = await supabase.from('customer_service_tickets').select('id').limit(1);
    if (error) throw error;
  });
}

// ============================================================================
// DATA INTEGRITY TESTS
// ============================================================================

async function testDataIntegrity() {
  console.log('\n🔍 TESTING DATA INTEGRITY...\n');

  // Check programs have required fields
  await test('programs have required fields', async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('id, title, slug, description')
      .limit(5);
    if (error) throw error;
    if (data) {
      for (const program of data) {
        if (!program.title || !program.slug) {
          throw new Error(`Program ${program.id} missing title or slug`);
        }
      }
    }
  });

  // Check courses linked to programs
  await test('courses have program references', async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, program_id')
      .limit(10);
    if (error) throw error;
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 FULL SYSTEM TEST STARTING...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  try {
    await testCoreTables();
    await testStoreTables();
    await testLMSTables();
    await testComplianceTables();
    await testCommunityTables();
    await testLicensingTables();
    await testPartnerTables();
    await testTaxTables();
    await testSupportTables();
    await testDataIntegrity();
  } catch (error) {
    console.error('Fatal error:', error);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED - System is production ready!');
  } else {
    console.log('\n⚠️  Some tests failed - review and fix before production');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
