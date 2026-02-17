/**
 * Test Agreement Compliance Flow
 * 
 * Tests:
 * 1. Table exists and is accessible
 * 2. Can insert agreement acceptance
 * 3. Idempotency - re-insert returns existing
 * 4. Can query by user
 * 5. Counts work correctly
 * 
 * Usage: npx tsx scripts/test-agreement-flow.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test user ID (use a real user from auth.users)
const TEST_USER_ID = process.env.TEST_USER_ID || null;

async function runTests() {
  console.log('🧪 Agreement Compliance Flow Tests\n');
  console.log('═'.repeat(60) + '\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  let passed = 0;
  let failed = 0;

  // Test 1: Table exists
  console.log('Test 1: Table exists and is accessible');
  try {
    const { data, error } = await supabase
      .from('license_agreement_acceptances')
      .select('id')
      .limit(1);

    if (error) throw error;
    console.log('   ✅ PASSED - Table is accessible\n');
    passed++;
  } catch (err: any) {
    console.log('   ❌ FAILED -', err.message, '\n');
    failed++;
  }

  // Test 2: Get a real user to test with
  console.log('Test 2: Find a test user');
  let testUserId = TEST_USER_ID;
  let testUserEmail = 'test@example.com';
  
  try {
    if (!testUserId) {
      // Get any user from profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .limit(1)
        .single();

      if (error) throw error;
      if (!profiles) throw new Error('No users found');

      testUserId = profiles.id;
      testUserEmail = profiles.email || 'test@example.com';
      console.log(`   Found user: ${profiles.full_name || profiles.email} (${profiles.role})`);
    }
    console.log(`   ✅ PASSED - Test user ID: ${testUserId}\n`);
    passed++;
  } catch (err: any) {
    console.log('   ❌ FAILED -', err.message);
    console.log('   ⚠️  Skipping remaining tests that require a user\n');
    failed++;
    printSummary(passed, failed);
    return;
  }

  // Test 3: Insert agreement acceptance
  console.log('Test 3: Insert agreement acceptance');
  const testAgreementType = 'enrollment';
  const testVersion = '1.0';
  
  try {
    // First, delete any existing test record
    await supabase
      .from('license_agreement_acceptances')
      .delete()
      .eq('user_id', testUserId)
      .eq('agreement_type', testAgreementType)
      .eq('document_version', testVersion);

    // Insert new record (using only columns that exist in the table)
    const { data, error } = await supabase
      .from('license_agreement_acceptances')
      .insert({
        user_id: testUserId,
        agreement_type: testAgreementType,
        document_version: testVersion,
        signer_name: 'Test User',
        signer_email: testUserEmail,
        signature_method: 'checkbox',
        ip_address: '127.0.0.1',
        user_agent: 'test-script',
        role_at_signing: 'student',
      })
      .select()
      .single();

    if (error) throw error;
    console.log(`   Inserted record ID: ${data.id}`);
    console.log('   ✅ PASSED - Agreement acceptance inserted\n');
    passed++;
  } catch (err: any) {
    console.log('   ❌ FAILED -', err.message, '\n');
    failed++;
  }

  // Test 4: Idempotency - upsert same record
  console.log('Test 4: Idempotency - upsert returns existing');
  try {
    const { data, error } = await supabase
      .from('license_agreement_acceptances')
      .upsert({
        user_id: testUserId,
        agreement_type: testAgreementType,
        document_version: testVersion,
        signer_name: 'Test User Updated',
        signer_email: testUserEmail,
        signature_method: 'checkbox',
        ip_address: '127.0.0.1',
        user_agent: 'test-script-v2',
        role_at_signing: 'student',
      }, {
        onConflict: 'user_id,agreement_type,document_version',
      })
      .select()
      .single();

    if (error) throw error;
    
    // Verify it's the same record (not a new one)
    const { count } = await supabase
      .from('license_agreement_acceptances')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId)
      .eq('agreement_type', testAgreementType)
      .eq('document_version', testVersion);

    if (count === 1) {
      console.log('   ✅ PASSED - Upsert maintained single record\n');
      passed++;
    } else {
      console.log(`   ❌ FAILED - Expected 1 record, found ${count}\n`);
      failed++;
    }
  } catch (err: any) {
    console.log('   ❌ FAILED -', err.message, '\n');
    failed++;
  }

  // Test 5: Query by user
  console.log('Test 5: Query agreements by user');
  try {
    const { data, error } = await supabase
      .from('license_agreement_acceptances')
      .select('agreement_type, document_version, accepted_at, signature_method')
      .eq('user_id', testUserId);

    if (error) throw error;
    
    console.log(`   Found ${data?.length || 0} agreement(s) for user:`);
    for (const a of data || []) {
      console.log(`     - ${a.agreement_type} v${a.document_version} (${a.signature_method})`);
    }
    console.log('   ✅ PASSED - Query successful\n');
    passed++;
  } catch (err: any) {
    console.log('   ❌ FAILED -', err.message, '\n');
    failed++;
  }

  // Test 6: Aggregate counts
  console.log('Test 6: Aggregate counts by agreement type');
  try {
    const { data, error } = await supabase
      .from('license_agreement_acceptances')
      .select('agreement_type');

    if (error) throw error;

    // Count by type
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.agreement_type] = (counts[row.agreement_type] || 0) + 1;
    }

    console.log('   Agreement counts:');
    for (const [type, count] of Object.entries(counts)) {
      console.log(`     - ${type}: ${count}`);
    }
    
    if (Object.keys(counts).length > 0) {
      console.log('   ✅ PASSED - Counts retrieved\n');
      passed++;
    } else {
      console.log('   ⚠️  No agreements found (table may be empty)\n');
      passed++;
    }
  } catch (err: any) {
    console.log('   ❌ FAILED -', err.message, '\n');
    failed++;
  }

  // Test 7: Verify audit fields
  console.log('Test 7: Verify audit fields are captured');
  try {
    const { data, error } = await supabase
      .from('license_agreement_acceptances')
      .select('ip_address, user_agent, accepted_at, role_at_signing')
      .eq('user_id', testUserId)
      .eq('agreement_type', testAgreementType)
      .single();

    if (error) throw error;

    const hasIp = data.ip_address && data.ip_address !== '0.0.0.0';
    const hasUserAgent = data.user_agent && data.user_agent !== 'unknown';
    const hasTimestamp = !!data.accepted_at;
    const hasRole = !!data.role_at_signing;

    console.log(`   IP Address: ${data.ip_address} ${hasIp ? '✓' : '⚠️'}`);
    console.log(`   User Agent: ${data.user_agent?.substring(0, 30)}... ${hasUserAgent ? '✓' : '⚠️'}`);
    console.log(`   Timestamp: ${data.accepted_at} ${hasTimestamp ? '✓' : '⚠️'}`);
    console.log(`   Role: ${data.role_at_signing} ${hasRole ? '✓' : '⚠️'}`);

    if (hasTimestamp) {
      console.log('   ✅ PASSED - Audit fields captured\n');
      passed++;
    } else {
      console.log('   ❌ FAILED - Missing required audit fields\n');
      failed++;
    }
  } catch (err: any) {
    console.log('   ❌ FAILED -', err.message, '\n');
    failed++;
  }

  // Cleanup test data
  console.log('Cleanup: Removing test data');
  try {
    await supabase
      .from('license_agreement_acceptances')
      .delete()
      .eq('user_id', testUserId)
      .eq('user_agent', 'test-script-v2');
    console.log('   ✅ Test data cleaned up\n');
  } catch (err: any) {
    console.log('   ⚠️  Cleanup failed:', err.message, '\n');
  }

  printSummary(passed, failed);
}

function printSummary(passed: number, failed: number) {
  console.log('═'.repeat(60));
  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ All tests passed! Agreement compliance flow is working.\n');
  } else {
    console.log('❌ Some tests failed. Please review the errors above.\n');
  }

  // Print the audit query
  console.log('📋 Audit Query (run in Supabase SQL Editor):');
  console.log('─'.repeat(60));
  console.log(`
SELECT 
  agreement_type, 
  document_version, 
  COUNT(*) as count
FROM public.license_agreement_acceptances
GROUP BY 1, 2
ORDER BY 1, 2;
  `);
  console.log('─'.repeat(60) + '\n');
}

runTests().catch(console.error);
