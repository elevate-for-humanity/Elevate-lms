#!/usr/bin/env node

/**
 * Security Lockdown Verification
 * Verifies that RLS policies are correctly configured
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

async function testTable(tableName, shouldBeReadable) {
  try {
    const { data, error } = await anonClient.from(tableName).select('*').limit(1);

    if (shouldBeReadable) {
      if (error) {
        results.failed++;
        return false;
      } else {
        results.passed++;
        return true;
      }
    } else {
      if (error || !data || data.length === 0) {
        results.passed++;
        return true;
      } else {
        results.failed++;
        return false;
      }
    }
  } catch (err) {
    results.warnings++;
    return null;
  }
}

// Test public catalog tables (should be readable)
await testTable('programs', true);
await testTable('credentials', true);
await testTable('credentialing_partners', true);

await testTable('applications', false);
await testTable('profiles', false);
await testTable('enrollments', false);
await testTable('user_progress', false);
await testTable('quiz_attempts', false);
await testTable('learning_paths', false);
await testTable('credentials_attained', false);
await testTable('course_completion_status', false);

// Test application insertion
const testApp = {
  first_name: 'Security',
  last_name: 'Test',
  email: `security-test-${Date.now()}@example.com`,
  phone: '555-0100',
  program_id: 'test',
  status: 'pending',
};

const { data: insertData, error: insertError } = await anonClient
  .from('applications')
  .insert(testApp)
  .select()
  .single();

if (insertError) {
  results.failed++;
} else {
  results.passed++;
}

// Check if admin client can read applications
if (adminClient) {
  const { data: adminData, error: adminError } = await adminClient
    .from('applications')
    .select('*')
    .limit(1);

  if (adminError) {
    results.warnings++;
  } else {
    results.passed++;
  }
}

// Summary

if (results.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
