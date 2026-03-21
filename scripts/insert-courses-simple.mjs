#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY is required'); process.exit(1); }


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Courses from content/courses/ecd-courses.json
const courses = [
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician Training',
    subtitle: 'Master heating, ventilation, and air conditioning systems',
    description: 'Hands-on training to install, maintain, and repair heating and cooling systems for residential and commercial buildings.',
    level: 'beginner',
    duration_hours: 600,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/hvac-technician.jpg'
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    subtitle: 'Earn while you learn professional barbering',
    description: 'Earn-while-you-learn apprenticeship in a real barbershop, building hours toward state barber licensure.',
    level: 'beginner',
    duration_hours: 1500,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/barber-apprenticeship.jpg'
  },
  {
    slug: 'cna-healthcare',
    title: 'CNA & Healthcare Careers',
    subtitle: 'Start your healthcare career',
    description: 'Entry-level healthcare training focused on CNA skills, patient care, and pathways into medical careers.',
    level: 'beginner',
    duration_hours: 120,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/cna-healthcare.jpg'
  },
  {
    slug: 'cdl-transportation',
    title: 'CDL & Transportation Training',
    subtitle: 'Commercial driver training',
    description: 'Commercial driver training for high-earning transportation and logistics careers.',
    level: 'beginner',
    duration_hours: 160,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/cdl-transportation.jpg'
  },
  {
    slug: 'building-technician',
    title: 'Building Technician & Skilled Trades',
    subtitle: 'Facilities maintenance and building systems',
    description: 'Maintenance, basic electrical, plumbing, and systems skills for stable building and facilities roles.',
    level: 'beginner',
    duration_hours: 480,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/building-technician.jpg'
  },
  {
    slug: 'it-support-apprenticeship',
    title: 'IT Support & Help Desk Apprenticeship',
    subtitle: 'Technology support career',
    description: 'Foundational IT support training with apprenticeships in help desk, troubleshooting, and user support.',
    level: 'beginner',
    duration_hours: 320,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/it-support.jpg'
  },
  {
    slug: 'beauty-career-educator',
    title: 'Beauty & Career Educator Training',
    subtitle: 'Train the next generation',
    description: 'Hybrid program that prepares experienced beauty professionals to become educators and trainers.',
    level: 'intermediate',
    duration_hours: 240,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/beauty-educator.jpg'
  },
  {
    slug: 'electrical-apprenticeship',
    title: 'Electrical Apprenticeship',
    subtitle: 'Become a licensed electrician',
    description: 'Train as a licensed electrician through registered apprenticeship, learning residential and commercial electrical systems.',
    level: 'beginner',
    duration_hours: 800,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/electrical.jpg'
  },
  {
    slug: 'plumbing-apprenticeship',
    title: 'Plumbing Apprenticeship',
    subtitle: 'Master plumbing systems',
    description: 'Become a licensed plumber through hands-on apprenticeship training in residential and commercial plumbing systems.',
    level: 'beginner',
    duration_hours: 800,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/plumbing.jpg'
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    subtitle: 'Clinical and administrative healthcare',
    description: 'Support physicians and nurses in clinical settings, performing both administrative and basic clinical tasks.',
    level: 'beginner',
    duration_hours: 720,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/medical-assistant.jpg'
  },
  {
    slug: 'welding-fabrication',
    title: 'Welding & Metal Fabrication',
    subtitle: 'Industrial welding skills',
    description: 'Learn welding techniques and metal fabrication skills for manufacturing, construction, and industrial careers.',
    level: 'beginner',
    duration_hours: 640,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/welding.jpg'
  },
  {
    slug: 'culinary-arts',
    title: 'Culinary Arts & Food Service',
    subtitle: 'Professional cooking and food service',
    description: 'Master professional cooking techniques and food service management for restaurant and hospitality careers.',
    level: 'beginner',
    duration_hours: 600,
    status: 'published',
    is_free: true,
    thumbnail_url: '/images/courses/culinary.jpg'
  }
];

async function insertCourses() {

  for (const course of courses) {

    const { data, error } = await supabase
      .from('courses')
      .upsert(course, { onConflict: 'slug' });

    if (error) {
      console.error(`    ❌ Error: ${error.message}`);
    } else {
    }
  }
}

async function verify() {

  const { data, count, error } = await supabase
    .from('courses')
    .select('slug, title, status', { count: 'exact' })
    .eq('status', 'published');

  if (error) {
    console.error('❌ Error verifying:', error.message);
    return false;
  }


  if (data && data.length > 0) {
    data.forEach(course => {
    });
  }

  return count >= 12;
}

async function main() {
  await insertCourses();
  const verified = await verify();

  if (verified) {
  } else {
  }
}

main();
