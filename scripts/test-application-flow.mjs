#!/usr/bin/env node

/**
 * Test Application Submission Flow
 * Verifies that the application API works correctly after security lockdown
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test 1: Verify anon can insert applications
const testApplication = {
  first_name: 'Test',
  last_name: 'User',
  email: `test-${Date.now()}@example.com`,
  phone: '317-555-0100',
  program_id: 'barber',
  notes: 'Test application from automated test',
  status: 'pending',
};

const { data: insertData, error: insertError } = await supabase
  .from('applications')
  .insert(testApplication)
  .select()
  .single();

if (insertError) {
  console.error('❌ FAILED: Could not insert application');
  console.error('   Error:', insertError.message);
  process.exit(1);
} else {
}

// Test 2: Verify anon cannot read applications (security)
const { data: readData, error: readError } = await supabase
  .from('applications')
  .select('*')
  .limit(1);

if (readError || !readData || readData.length === 0) {
} else {
  console.error('❌ FAILED: Anonymous users can read applications (SECURITY ISSUE)');
  console.error('   This is a security vulnerability!');
  process.exit(1);
}

// Test 3: Verify public can read programs catalog
const { data: programsData, error: programsError } = await supabase
  .from('programs')
  .select('id, title, slug')
  .limit(5);

if (programsError) {
  console.error('❌ FAILED: Cannot read programs catalog');
  console.error('   Error:', programsError.message);
  process.exit(1);
} else if (!programsData || programsData.length === 0) {
} else {
}

// Test 4: Verify public can read credentials catalog
const { data: credentialsData, error: credentialsError } = await supabase
  .from('credentials')
  .select('id, name')
  .limit(5);

if (credentialsError) {
  console.error('❌ FAILED: Cannot read credentials catalog');
  console.error('   Error:', credentialsError.message);
  process.exit(1);
} else {
}

// Summary
