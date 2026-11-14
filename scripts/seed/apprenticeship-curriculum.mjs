/**
 * Seed Apprenticeship Curriculum
 * Creates comprehensive modules and lessons for all apprenticeship courses
 * - Indiana State Board aligned
 * - State Board exam prep
 * - DOL progress tracking
 * 
 * Run: node scripts/seed/apprenticeship-curriculum.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Barber Course Modules & Lessons - Indiana State Board Aligned + DOL
const BARBER_MODULES = [
  {
    title: 'Module 1: Foundations & Professional Development',
    sort_order: 1,
    lessons: [
      { title: 'History and Culture of Barbering', duration: 120, description: 'Explore the rich history of barbering from ancient civilizations to modern barbershops.' },
      { title: 'Indiana Barber Licensing Laws (IC 25-7)', duration: 90, description: 'Understand Indiana Code 25-7 governing barber licensing and practice.' },
      { title: 'Professional Ethics and Client Communication', duration: 60, description: 'Build strong client relationships through effective communication.' },
      { title: 'Sanitation, Disinfection & Infection Control', duration: 180, description: 'Master CDC and Indiana Board infection control standards.' },
      { title: 'Tool Identification and Maintenance', duration: 90, description: 'Identify, use, and maintain all barber tools properly.' },
    ]
  },
  {
    title: 'Module 2: Hair Cutting Fundamentals',
    sort_order: 2,
    lessons: [
      { title: 'Hair Analysis and Consultation', duration: 60, description: 'Learn to analyze hair type, face shape, and client preferences.' },
      { title: 'Sanitary Haircutting Procedures', duration: 45, description: 'Maintain proper sanitation during all haircutting services.' },
      { title: 'Clipper Techniques: Fades & Tapers', duration: 180, description: 'Master low, mid, and high fades with clipper over comb.' },
      { title: 'Scissor-Over-Comb Technique', duration: 120, description: 'Precision scissor work for seamless blends.' },
      { title: 'Shear Work and Texturizing', duration: 120, description: 'Layering, thinning, and texturizing techniques.' },
      { title: 'Shape-Ups and Edge Work', duration: 90, description: 'Clean hairlines, edges, and design lines.' },
      { title: 'Flat Tops and Specialty Cuts', duration: 120, description: 'Precision flat top cutting and styling.' },
      { title: 'Hair Design and Creative Styling', duration: 120, description: 'Modern designs, hair art, and creative styling.' },
    ]
  },
  {
    title: 'Module 3: Shaving & Facial Hair',
    sort_order: 3,
    lessons: [
      { title: 'Straight Razor Shaving Fundamentals', duration: 180, description: 'Master the classic straight razor shave technique.' },
      { title: 'Beard Shaping and Design', duration: 120, description: 'Shape, style, and maintain all beard styles.' },
      { title: 'Hot Towel Treatment and Facial Care', duration: 90, description: 'Hot towel treatments and basic facial care.' },
      { title: 'Mustache Trimming and Styling', duration: 60, description: 'Classic and modern mustache styles.' },
      { title: 'Shaving Safety and Contraindications', duration: 60, description: 'Safety protocols and when not to shave.' },
    ]
  },
  {
    title: 'Module 4: Scalp, Hair Science & Chemistry',
    sort_order: 4,
    lessons: [
      { title: 'Hair and Scalp Anatomy', duration: 90, description: 'Understanding hair structure, growth cycles, and scalp health.' },
      { title: 'Common Scalp Conditions and Treatments', duration: 120, description: 'Identify and address dandruff, alopecia, folliculitis.' },
      { title: 'Hair Chemistry: Relaxers and Texturizers', duration: 120, description: 'Safe chemical treatments for texture change.' },
      { title: 'Hair Coloring Fundamentals', duration: 180, description: 'Basic coloring techniques for barbers.' },
      { title: 'Product Knowledge and Recommendations', duration: 60, description: 'Recommend the right products for each client.' },
    ]
  },
  {
    title: 'Module 5: Business Management & Career Skills',
    sort_order: 5,
    lessons: [
      { title: 'Barbershop Operations and Workflow', duration: 90, description: 'Efficient salon/shop operations management.' },
      { title: 'Client Booking and Scheduling Systems', duration: 60, description: 'Manage appointments with booking software.' },
      { title: 'Pricing Strategy and Service Menu Development', duration: 60, description: 'Set profitable prices and create service menus.' },
      { title: 'Marketing Your Barber Services', duration: 60, description: 'Social media marketing and client referrals.' },
      { title: 'Financial Basics: Income, Taxes, and Tips', duration: 60, description: 'Handle your finances, taxes, and tips.' },
      { title: 'Building Your Clientele', duration: 60, description: 'Build a loyal client following.' },
    ]
  },
  {
    title: 'Module 6: Indiana State Board Exam Preparation',
    sort_order: 6,
    lessons: [
      { title: 'Written Exam Overview and Study Guide', duration: 120, description: 'Complete review of all theory topics for the exam.' },
      { title: 'Sanitation and Safety Exam Questions', duration: 90, description: 'Practice sanitation and safety questions.' },
      { title: 'Indiana Barber Law and Rules Review', duration: 90, description: 'Review Indiana Code 25-7 for the exam.' },
      { title: 'Practical Exam: Haircutting Station Setup', duration: 60, description: 'Proper station setup for practical exam.' },
      { title: 'Practical Exam: Straight Razor Shave', duration: 90, description: 'Timed straight razor service practice.' },
      { title: 'Practice Written Examination', duration: 120, description: '80% passing score required to proceed.' },
    ]
  },
  {
    title: 'Module 7: DOL Progress Tracking & Competencies',
    sort_order: 7,
    lessons: [
      { title: 'DOL Apprenticeship On-the-Job Training Log', duration: 30, description: 'Track your 1,500 OJT hours documentation.' },
      { title: 'Competency Assessments: Month 1-3', duration: 60, description: 'Sanitation, tools, basic cuts competencies.' },
      { title: 'Competency Assessments: Month 4-6', duration: 60, description: 'Fades, shaves, client services competencies.' },
      { title: 'Competency Assessments: Month 7-9', duration: 60, description: 'Chemical services, design competencies.' },
      { title: 'Competency Assessments: Month 10-12', duration: 60, description: 'License prep, business competencies.' },
      { title: 'Portfolio Documentation Requirements', duration: 60, description: '50+ documented client services portfolio.' },
      { title: 'DOL Registered Apprenticeship Completion', duration: 30, description: 'Finalize DOL certificate and license.' },
    ]
  },
];

// Cosmetology Modules - Indiana State Board Aligned
const COSMETOLOGY_MODULES = [
  { title: 'Module 1: Foundations of Cosmetology', sort_order: 1, lessons: [
    { title: 'History and Career Paths in Cosmetology', duration: 90 },
    { title: 'Indiana Cosmetology Laws and Licensing', duration: 90 },
    { title: 'Infection Control and Sanitation', duration: 180 },
    { title: 'Professional Ethics and Client Relations', duration: 60 },
  ]},
  { title: 'Module 2: Hair Care and Styling (Indiana State Board Aligned)', sort_order: 2, lessons: [
    { title: 'Hair Structure and Chemistry', duration: 120 },
    { title: 'Shampooing and Conditioning', duration: 90 },
    { title: 'Hair Cutting Techniques', duration: 240 },
    { title: 'Hairstyling and Blow-Drying', duration: 180 },
    { title: 'Braiding and Updos', duration: 120 },
    { title: 'Wigs and Hair Enhancements', duration: 90 },
  ]},
  { title: 'Module 3: Chemical Services (Indiana State Board Aligned)', sort_order: 3, lessons: [
    { title: 'Hair Coloring and Bleaching', duration: 240 },
    { title: 'Hair Lightening and Highlighting', duration: 180 },
    { title: 'Chemical Hair Relaxing', duration: 120 },
    { title: 'Permanent Waving', duration: 180 },
    { title: 'Chemical Safety and Allergies', duration: 60 },
  ]},
  { title: 'Module 4: Skin Care and Facials (Indiana State Board Aligned)', sort_order: 4, lessons: [
    { title: 'Skin Anatomy and Analysis', duration: 90 },
    { title: 'Facial Treatments', duration: 180 },
    { title: 'Hair Removal Techniques', duration: 120 },
    { title: 'Makeup Application', duration: 180 },
    { title: 'Advanced Skin Treatments', duration: 90 },
  ]},
  { title: 'Module 5: Nail Technology (Indiana State Board Aligned)', sort_order: 5, lessons: [
    { title: 'Nail Anatomy and Disorders', duration: 60 },
    { title: 'Manicuring and Pedicuring', duration: 180 },
    { title: 'Nail Tips and Sculptured Nails', duration: 120 },
    { title: 'Nail Polish and Art', duration: 60 },
  ]},
  { title: 'Module 6: Indiana State Board Exam Prep', sort_order: 6, lessons: [
    { title: 'Written Exam Study Guide', duration: 180 },
    { title: 'Practical Exam Preparation', duration: 180 },
    { title: 'Practice Examinations', duration: 120 },
  ]},
  { title: 'Module 7: Business and Career Skills', sort_order: 7, lessons: [
    { title: 'Salon Business Management', duration: 90 },
    { title: 'Retail and Product Sales', duration: 60 },
    { title: 'Building Your Clientele', duration: 60 },
  ]},
];

// Esthetician Modules - Indiana State Board Aligned
const ESTHETICIAN_MODULES = [
  { title: 'Module 1: Esthetics Foundations', sort_order: 1, lessons: [
    { title: 'History and Career Paths', duration: 30 },
    { title: 'Indiana Esthetics Laws', duration: 60 },
    { title: 'Infection Control and Safety', duration: 90 },
    { title: 'Skin Anatomy and Physiology', duration: 120 },
    { title: 'Skin Types and Conditions', duration: 90 },
  ]},
  { title: 'Module 2: Facial Treatments (Indiana State Board Aligned)', sort_order: 2, lessons: [
    { title: 'Facial Consultation and Analysis', duration: 60 },
    { title: 'Basic Facial Procedures', duration: 180 },
    { title: 'Advanced Facial Treatments', duration: 180 },
    { title: 'Chemical Peels', duration: 120 },
    { title: 'Microcurrent and LED Therapy', duration: 90 },
  ]},
  { title: 'Module 3: Hair Removal (Indiana State Board Aligned)', sort_order: 3, lessons: [
    { title: 'Waxing Fundamentals', duration: 90 },
    { title: 'Facial Waxing Techniques', duration: 90 },
    { title: 'Body Waxing', duration: 90 },
    { title: 'Threading', duration: 60 },
  ]},
  { title: 'Module 4: Makeup Artistry (Indiana State Board Aligned)', sort_order: 4, lessons: [
    { title: 'Color Theory and Products', duration: 60 },
    { title: 'Basic Makeup Application', duration: 120 },
    { title: 'Special Occasion Makeup', duration: 90 },
    { title: 'Airbrush Makeup', duration: 60 },
  ]},
  { title: 'Module 5: Indiana State Board Exam Prep', sort_order: 5, lessons: [
    { title: 'Written Exam Study Guide', duration: 120 },
    { title: 'Practical Exam Prep', duration: 180 },
    { title: 'Practice Tests', duration: 90 },
  ]},
];

// Nail Technician Modules - Indiana State Board Aligned
const NAIL_MODULES = [
  { title: 'Module 1: Nail Technology Foundations', sort_order: 1, lessons: [
    { title: 'History and Career Paths', duration: 30 },
    { title: 'Indiana Nail Laws', duration: 45 },
    { title: 'Infection Control and Safety', duration: 60 },
    { title: 'Nail Anatomy and Disorders', duration: 90 },
    { title: 'Client Consultation', duration: 30 },
  ]},
  { title: 'Module 2: Manicuring (Indiana State Board Aligned)', sort_order: 2, lessons: [
    { title: 'Basic Manicure Procedures', duration: 90 },
    { title: 'Spa Manicure', duration: 60 },
    { title: 'Hot Oil Manicure', duration: 45 },
    { title: 'French Manicure', duration: 45 },
    { title: 'Nail Polish Application', duration: 30 },
  ]},
  { title: 'Module 3: Pedicuring (Indiana State Board Aligned)', sort_order: 3, lessons: [
    { title: 'Basic Pedicure Procedures', duration: 90 },
    { title: 'Spa Pedicure', duration: 60 },
    { title: 'Callus Treatment', duration: 45 },
  ]},
  { title: 'Module 4: Nail Enhancements (Indiana State Board Aligned)', sort_order: 4, lessons: [
    { title: 'Acrylic Nail Extensions', duration: 120 },
    { title: 'Gel Nails', duration: 90 },
    { title: 'Nail Repair', duration: 45 },
    { title: 'Fill-Ins and Maintenance', duration: 60 },
  ]},
  { title: 'Module 5: Nail Art and Design', sort_order: 5, lessons: [
    { title: 'Nail Art Fundamentals', duration: 60 },
    { title: 'Advanced Nail Art Techniques', duration: 60 },
  ]},
  { title: 'Module 6: Indiana State Board Exam Prep', sort_order: 6, lessons: [
    { title: 'Written Exam Study Guide', duration: 90 },
    { title: 'Practical Exam Prep', duration: 120 },
    { title: 'Practice Tests', duration: 60 },
  ]},
];

async function getOrCreateCourse(titleSlug) {
  // Try to find existing course by slug pattern
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title')
    .like('slug', `%${titleSlug}%`)
    .limit(1);
  
  if (courses && courses.length > 0) {
    return courses[0];
  }
  
  // Try by title
  const { data: coursesByTitle } = await supabase
    .from('courses')
    .select('id, slug, title')
    .ilike('title', `%${titleSlug}%`)
    .limit(1);
  
  if (coursesByTitle && coursesByTitle.length > 0) {
    return coursesByTitle[0];
  }
  
  return null;
}

async function seedModulesAndLessons(courseId, modules, courseName) {
  console.log(`\n=== Seeding curriculum for: ${courseName} ===`);
  
  // Check if modules already exist
  const { data: existingModules } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .limit(1);
  
  if (existingModules && existingModules.length > 0) {
    console.log(`  Course already has modules, skipping...`);
    return;
  }
  
  for (const mod of modules) {
    const { data: module, error: modErr } = await supabase
      .from('course_modules')
      .insert({ 
        course_id: courseId, 
        title: mod.title, 
        sort_order: mod.sort_order,
        slug: mod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      })
      .select('id')
      .single();

    if (modErr || !module) {
      console.error(`  Failed to create module: ${mod.title}`, modErr);
      continue;
    }

    for (let i = 0; i < mod.lessons.length; i++) {
      const lesson = mod.lessons[i];
      await supabase.from('course_lessons').insert({
        module_id: module.id,
        title: lesson.title,
        lesson_number: i + 1,
        duration_minutes: lesson.duration || 60,
        description: lesson.description || lesson.title,
        content: `<h2>${lesson.title}</h2><p>This lesson covers ${lesson.title}. Content aligned with Indiana State Board Aligned Standards and state board exam requirements.</p>`,
      });
    }
    console.log(`  ✓ ${mod.title}: ${mod.lessons.length} lessons`);
  }
}

async function main() {
  console.log('Seeding Apprenticeship Curriculum...');
  
  // Find courses by program type
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title, program_id')
    .eq('status', 'published')
    .or('title.ilike.%barber%,title.ilike.%cosmetology%,title.ilike.%esthetic%,title.ilike.%nail%')
    .limit(10);
  
  console.log(`Found ${courses?.length || 0} apprenticeship courses`);
  
  for (const course of courses || []) {
    const slug = course.slug.toLowerCase();
    const title = course.title.toLowerCase();
    
    if (slug.includes('barber') || title.includes('barber')) {
      await seedModulesAndLessons(course.id, BARBER_MODULES, course.title);
    } else if (slug.includes('cosmetolog') || title.includes('cosmetolog')) {
      await seedModulesAndLessons(course.id, COSMETOLOGY_MODULES, course.title);
    } else if (slug.includes('esthetic') || title.includes('esthetic')) {
      await seedModulesAndLessons(course.id, ESTHETICIAN_MODULES, course.title);
    } else if (slug.includes('nail') || title.includes('nail tech')) {
      await seedModulesAndLessons(course.id, NAIL_MODULES, course.title);
    }
  }
  
  console.log('\n=== Curriculum Seeding Complete ===');
}

main().catch(console.error);
