#!/usr/bin/env node
/**
 * Dashboard Schema Verification Script
 * Checks if required tables and columns exist for dashboards
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Check profiles table
const { data: profilesData, error: profilesError } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (profilesError) {
  console.error('❌ profiles table error:', profilesError.message);
} else {
  if (profilesData && profilesData.length > 0) {
    const columns = Object.keys(profilesData[0]);

    // Check for required columns
    const requiredColumns = ['id', 'email', 'role', 'full_name'];
    const missingColumns = requiredColumns.filter((col) => !columns.includes(col));
    if (missingColumns.length > 0) {
    }
  }
}

// Check enrollments table
const { data: enrollmentsData, error: enrollmentsError } = await supabase
  .from('enrollments')
  .select('*')
  .limit(1);

if (enrollmentsError) {
  console.error('❌ enrollments table error:', enrollmentsError.message);
} else {
  if (enrollmentsData && enrollmentsData.length > 0) {
    const columns = Object.keys(enrollmentsData[0]);

    // Check for required columns
    const requiredColumns = ['id', 'user_id', 'program_id', 'status'];
    const missingColumns = requiredColumns.filter((col) => !columns.includes(col));
    if (missingColumns.length > 0) {
    }
  }
}

// Check other required tables
const requiredTables = [
  'programs',
  'course_progress',
  'certifications',
  'job_postings',
  'job_applications',
  'job_placements',
  'compliance_reports',
  'compliance_scores',
  'student_verifications',
  'apprenticeship_programs',
];

for (const table of requiredTables) {
  const { data, error } = await supabase.from(table).select('*').limit(1);

  if (error) {
  } else {
  }
}
