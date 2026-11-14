#!/usr/bin/env tsx
/**
 * Seed student data using Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const firstNames = [
  'James',
  'Mary',
  'John',
  'Patricia',
  'Robert',
  'Jennifer',
  'Michael',
  'Linda',
  'William',
  'Barbara',
  'David',
  'Elizabeth',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Christopher',
  'Nancy',
  'Daniel',
  'Lisa',
  'Matthew',
  'Betty',
  'Anthony',
  'Margaret',
  'Mark',
  'Sandra',
  'Donald',
  'Ashley',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
];

const cities = ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  return `(317) ${200 + Math.floor(Math.random() * 800)}-${1000 + Math.floor(Math.random() * 9000)}`;
}

async function main() {
  console.log('🚀 Student Seeder v2\n');

  // Get tenant info
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('tenant_id, organization_id')
    .limit(1)
    .single();

  const tenantId = existingProfile?.tenant_id;
  const orgId = existingProfile?.organization_id;

  // Get courses (enrollments use course_id, not program_id)
  const { data: courses } = await supabase
    .from('courses')
    .select('id, course_name')
    .eq('is_active', true)
    .limit(15);

  console.log(`📚 Courses: ${courses?.length || 0}`);
  console.log(`🏢 Tenant: ${tenantId}\n`);

  const numStudents = 150; // Add more students
  let created = 0;

  for (let i = 0; i < numStudents; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Date.now()}${i}@student.elevate.edu`;
    const fullName = `${firstName} ${lastName}`;

    try {
      // Create auth user with admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: process.env.SEED_STUDENT_PASSWORD || `Seed${Date.now().toString(36)}!`,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (authError) {
        console.log(`   ❌ ${i}: ${authError.message}`);
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) continue;

      // Insert profile directly (trigger may not exist)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'student',
        enrollment_status: 'pending',
        phone: generatePhone(),
        city: randomItem(cities),
        state: 'IN',
        tenant_id: tenantId,
        organization_id: orgId,
      });

      if (profileError) {
        console.log(`   ⚠️ Profile insert: ${profileError.message}`);
      }

      // Create enrollment (uses course_id)
      if (courses?.length && Math.random() > 0.4) {
        const course = randomItem(courses);
        const { error: enrollError } = await supabase.from('enrollments').insert({
          user_id: userId,
          course_id: course.id,
          status: Math.random() > 0.5 ? 'active' : 'pending',
          progress: Math.floor(Math.random() * 80),
          enrolled_at: new Date().toISOString(),
        });
        if (enrollError && created <= 3) {
          console.log(`   ⚠️ Enrollment: ${enrollError.message}`);
        }
      }

      created++;
      if (created % 10 === 0) console.log(`   ✅ Created ${created} students...`);
    } catch (err) {
      console.log(`   ❌ Error: ${err}`);
    }
  }

  // Final counts
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: enrollCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Final counts:`);
  console.log(`   Profiles: ${profileCount}`);
  console.log(`   Enrollments: ${enrollCount}`);
  console.log(`\n✅ Created ${created} new students!`);
}

main().catch(console.error);
