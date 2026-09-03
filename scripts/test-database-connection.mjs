#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests if database is accessible and working
 */

import { createClient } from '@supabase/supabase-js';

const PRODUCTION_URL = 'https://www.elevateforhumanity.org';

// Test 1: Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

// Test 2: Create Client
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  process.exit(1);
}

// Test 3: Database Connection
try {
  const { data, error } = await supabase.from('profiles').select('count').limit(1);

  if (error) {
    process.exit(1);
  }
} catch (error) {
  process.exit(1);
}

// Test 4: Check Critical Tables
const criticalTables = [
  'profiles',
  'applications',
  'enrollments',
  'courses',
  'programs',
  'tenants',
  'licenses',
];

let allTablesExist = true;
for (const table of criticalTables) {
  try {
    const { error } = await supabase.from(table).select('count').limit(1);

    if (error) {
      allTablesExist = false;
    } else {
    }
  } catch (error) {
    allTablesExist = false;
  }
}

if (!allTablesExist) {
  process.exit(1);
}

// Test 5: Test RLS Policies (public access)
try {
  const { data, error } = await supabase.from('programs').select('id, name, slug').limit(5);

  if (error) {
    process.exit(1);
  }

  if (!data || data.length === 0) {
  } else {
  }
} catch (error) {
  process.exit(1);
}

process.exit(0);
