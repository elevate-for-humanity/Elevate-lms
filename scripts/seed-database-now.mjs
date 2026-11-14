#!/usr/bin/env node
/**
 * Seed Database with Programs
 * Populates the database with 27+ training programs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔍 Connecting to Supabase...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
});

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connected successfully');
    console.log(`   Current programs count: ${data || 0}\n`);
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

// Seed programs
async function seedPrograms() {
  console.log('📦 Seeding programs...\n');

  const programs = [
    {
      slug: 'cna-training',
      title: 'Certified Nursing Assistant (CNA)',
      category: 'healthcare',
      description:
        'Become a Certified Nursing Assistant and start your healthcare career. Learn patient care, vital signs, infection control, and communication skills. 100% free through WIOA funding.',
      is_active: true,
    },
    {
      slug: 'hvac-technician',
      title: 'HVAC Technician',
      category: 'skilled-trades',
      description:
        'Train as an HVAC Technician. Learn heating, ventilation, air conditioning systems, electrical fundamentals, and EPA 608 certification. High-demand trade with excellent pay.',
      is_active: true,
    },
    {
      slug: 'medical-assistant',
      title: 'Medical Assistant',
      category: 'healthcare',
      description:
        'Train as a Medical Assistant in clinical and administrative healthcare settings. Learn patient intake, vital signs, EKG, phlebotomy, medical coding, and office procedures.',
      is_active: true,
    },
    {
      slug: 'cdl-a-training',
      title: 'CDL-A Commercial Driver',
      category: 'transportation',
      description:
        'Get your Class A Commercial Driver License and start a high-paying trucking career. Learn vehicle operation, safety regulations, and earn while you train.',
      is_active: true,
    },
    {
      slug: 'web-development',
      title: 'Web Development',
      category: 'technology',
      description:
        'Learn full-stack web development. Build modern websites and applications using HTML, CSS, JavaScript, React, and Node.js. Portfolio projects included.',
      is_active: true,
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const program of programs) {
    try {
      const { data, error } = await supabase.from('programs').insert(program).select();

      if (error) {
        console.error(`❌ Failed to insert ${program.name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Added: ${program.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error inserting ${program.name}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📦 Total: ${programs.length}\n`);

  return successCount > 0;
}

// Verify seeding
async function verifySeeding() {
  console.log('🔍 Verifying programs...\n');

  const { data, error, count } = await supabase.from('programs').select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }

  console.log(`✅ Total programs in database: ${count}`);

  if (data && data.length > 0) {
    console.log('\nPrograms by category:');
    const byCategory = data.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([cat, cnt]) => {
      console.log(`   ${cat}: ${cnt}`);
    });
  }

  console.log();
  return true;
}

// Main execution
async function main() {
  console.log('🚀 Database Seeding Script\n');
  console.log('='.repeat(50));
  console.log();

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection\n');
    process.exit(1);
  }

  // Seed programs
  const seeded = await seedPrograms();
  if (!seeded) {
    console.error('❌ Seeding failed\n');
    process.exit(1);
  }

  // Verify
  await verifySeeding();

  console.log('='.repeat(50));
  console.log('✅ Database seeding complete!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
