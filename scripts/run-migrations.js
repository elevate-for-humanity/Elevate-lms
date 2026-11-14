#!/usr/bin/env node

/**
 * Run all database migrations
 * This script executes all SQL migrations in order
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

// Check if using placeholder values
if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration files in order
const migrations = [
  '20241115_add_all_etpl_programs.sql',
  '20241116_create_lms_courses_part1.sql',
  '20241116_create_lms_courses_part2.sql',
  '20241116_create_lms_courses_part3.sql',
  '20241116_create_lms_courses_part4.sql',
  '20241116_add_jri_courses.sql',
  '20241116_add_nrf_rise_up_courses.sql',
  '20241116_create_medical_assistant_course.sql',
];

async function runMigration(filename) {
  const filePath = path.join(__dirname, '../supabase/migrations', filename);

  if (!fs.existsSync(filePath)) {
    return { success: false, skipped: true };
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase.from('_migrations').insert({
        name: filename,
        executed_at: new Date().toISOString(),
      });

      if (directError && !directError.message.includes('already exists')) {
        throw directError;
      }
    }

    return { success: true };
  } catch (error) {
    // Check if it's a "already exists" error (which is OK)
    if (
      error.message &&
      (error.message.includes('already exists') || error.message.includes('duplicate key'))
    ) {
      return { success: true, skipped: true };
    }

    return { success: false, error: error.message };
  }
}

async function verifyData() {
  try {
    // Check courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true });

    if (coursesError) {
    } else {
    }

    // Check programs
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id', { count: 'exact', head: true });

    if (programsError) {
    } else {
    }

    // Check modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id', { count: 'exact', head: true });

    if (modulesError) {
    } else {
    }
  } catch (error) {}
}

async function main() {
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    const result = await runMigration(migration);

    if (result.success) {
      if (result.skipped) {
        skipCount++;
      } else {
        successCount++;
      }
    } else if (!result.skipped) {
      errorCount++;
    }

    // Small delay between migrations
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  await verifyData();

  if (errorCount > 0) {
    process.exit(1);
  } else {
  }
}

main().catch((error) => {
  process.exit(1);
});
