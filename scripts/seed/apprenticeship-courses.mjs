/**
 * Seed Apprenticeship Courses
 * Creates comprehensive courses for all apprenticeship programs
 * - Indiana State Board Aligned Standards for beauty programs
 * - State Board exam prep
 * - DOL progress tracking
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Comprehensive Barber Course - Indiana State Board Aligned Standards
const BARBER_COURSE = {
  title: 'Barber Apprenticeship - Complete Course',
  subtitle: 'DOL Registered Barber Apprenticeship with Indiana State Board Aligned Standards & Indiana State Board Prep',
  description: 'Comprehensive 2,000-hour barber apprenticeship covering all Indiana State Board Aligned standards, Indiana state board exam preparation, and hands-on OJT training. Compliant with DOL registered apprenticeship requirements.',
  category: 'Barber Apprenticeship',
  duration_hours: 2000,
  passing_score: 80,
  status: 'published',
  modules: [
    { title: 'Module 1: Foundations & Professional Development', sort_order: 1, lessons: [
      { title: 'History and Culture of Barbering', duration: 120 },
      { title: 'Indiana Barber Licensing Laws (IC 25-7)', duration: 90 },
      { title: 'Professional Ethics and Client Communication', duration: 60 },
      { title: 'Sanitation, Disinfection & Infection Control', duration: 180 },
      { title: 'Tool Identification and Maintenance', duration: 90 },
    ]},
    { title: 'Module 2: Hair Cutting Fundamentals (Indiana State Board Aligned Standards)', sort_order: 2, lessons: [
      { title: 'Hair Analysis and Consultation', duration: 60 },
      { title: 'Sanitary Haircutting Procedures', duration: 45 },
      { title: 'Clipper Techniques: Fades & Tapers', duration: 180 },
      { title: 'Scissor-Over-Comb Technique', duration: 120 },
      { title: 'Shear Work and Texturizing', duration: 120 },
      { title: 'Shape-Ups and Edge Work', duration: 90 },
      { title: 'Flat Tops and Specialty Cuts', duration: 120 },
      { title: 'Hair Design and Creative Styling', duration: 120 },
    ]},
    { title: 'Module 3: Shaving & Facial Hair (Indiana State Board Aligned Standards)', sort_order: 3, lessons: [
      { title: 'Straight Razor Shaving Fundamentals', duration: 180 },
      { title: 'Beard Shaping and Design', duration: 120 },
      { title: 'Hot Towel Treatment and Facial Care', duration: 90 },
      { title: 'Mustache Trimming and Styling', duration: 60 },
      { title: 'Shaving Safety and Contraindications', duration: 60 },
    ]},
    { title: 'Module 4: Scalp, Hair Science & Chemistry', sort_order: 4, lessons: [
      { title: 'Hair and Scalp Anatomy', duration: 90 },
      { title: 'Common Scalp Conditions and Treatments', duration: 120 },
      { title: 'Hair Chemistry: Relaxers and Texturizers', duration: 120 },
      { title: 'Hair Coloring Fundamentals', duration: 180 },
      { title: 'Product Knowledge and Recommendations', duration: 60 },
    ]},
    { title: 'Module 5: Business Management & Career Skills', sort_order: 5, lessons: [
      { title: 'Barbershop Operations and Workflow', duration: 90 },
      { title: 'Client Booking and Scheduling Systems', duration: 60 },
      { title: 'Pricing Strategy and Service Menu Development', duration: 60 },
      { title: 'Marketing Your Barber Services', duration: 60 },
      { title: 'Financial Basics: Income, Taxes, and Tips', duration: 60 },
      { title: 'Building Your Clientele', duration: 60 },
    ]},
    { title: 'Module 6: Indiana State Board Exam Preparation', sort_order: 6, lessons: [
      { title: 'Written Exam Overview and Study Guide', duration: 120 },
      { title: 'Sanitation and Safety Exam Questions', duration: 90 },
      { title: 'Indiana Barber Law and Rules Review', duration: 90 },
      { title: 'Practical Exam: Haircutting Station Setup', duration: 60 },
      { title: 'Practical Exam: Straight Razor Shave', duration: 90 },
      { title: 'Practice Written Examination', duration: 120 },
    ]},
    { title: 'Module 7: DOL Progress Tracking & Competencies', sort_order: 7, lessons: [
      { title: 'DOL Apprenticeship On-the-Job Training Log', duration: 30 },
      { title: 'Competency Assessments: Month 1-3', duration: 60 },
      { title: 'Competency Assessments: Month 4-6', duration: 60 },
      { title: 'Competency Assessments: Month 7-9', duration: 60 },
      { title: 'Competency Assessments: Month 10-12', duration: 60 },
      { title: 'Portfolio Documentation Requirements', duration: 60 },
      { title: 'DOL Registered Apprenticeship Completion', duration: 30 },
    ]},
  ]
};

// Comprehensive Cosmetology Course - Indiana State Board Aligned Standards
const COSMETOLOGY_COURSE = {
  title: 'Cosmetology Apprenticeship - Complete Course',
  subtitle: 'Indiana Cosmetology License Apprenticeship with Indiana State Board Aligned Standards & State Board Prep',
  description: '2,000-hour cosmetology apprenticeship following Indiana State Board Aligned standards, preparing for Indiana cosmetology license exam.',
  category: 'Cosmetology',
  duration_hours: 2000,
  passing_score: 80,
  status: 'published',
  modules: [
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
  ]
};

// Esthetician Course - Indiana State Board Aligned Standards
const ESTHETICIAN_COURSE = {
  title: 'Esthetician Apprenticeship - Complete Course',
  subtitle: 'Indiana Esthetician License with Indiana State Board Aligned Standards & Advanced Skin Care',
  description: 'Comprehensive esthetics apprenticeship covering advanced skin care, facial treatments, and Indiana state board exam preparation.',
  category: 'Esthetician',
  duration_hours: 700,
  passing_score: 80,
  status: 'published',
  modules: [
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
  ]
};

// Nail Technician Course - Indiana State Board Aligned Standards
const NAIL_TECHNICIAN_COURSE = {
  title: 'Nail Technician Apprenticeship - Complete Course',
  subtitle: 'Indiana Nail Technician License with Indiana State Board Aligned Standards & Advanced Nail Art',
  description: 'Complete nail technician apprenticeship covering manicures, pedicures, nail enhancements, and Indiana state board exam prep.',
  category: 'Nail Technology',
  duration_hours: 400,
  passing_score: 80,
  status: 'published',
  modules: [
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
  ]
};

// Culinary Course - ServSafe & Industry Standards
const CULINARY_COURSE = {
  title: 'Culinary Arts Apprenticeship - Complete Course',
  subtitle: 'DOL Registered Culinary Apprenticeship with ServSafe and Industry Certification',
  description: 'Comprehensive culinary apprenticeship covering food safety, cooking techniques, and industry certifications.',
  category: 'Culinary Arts',
  duration_hours: 2000,
  passing_score: 80,
  status: 'published',
  modules: [
    { title: 'Module 1: Culinary Foundations', sort_order: 1, lessons: [
      { title: 'History of Culinary Arts', duration: 60 },
      { title: 'Kitchen Safety and Sanitation', duration: 120 },
      { title: 'ServSafe Certification Prep', duration: 180 },
      { title: 'Kitchen Equipment and Tools', duration: 90 },
    ]},
    { title: 'Module 2: Cooking Fundamentals', sort_order: 2, lessons: [
      { title: 'Knife Skills and Preps', duration: 180 },
      { title: 'Stocks, Sauces, and Soups', duration: 180 },
      { title: 'Vegetable and Starch Cookery', duration: 120 },
      { title: 'Meat, Poultry, and Seafood', duration: 180 },
    ]},
    { title: 'Module 3: Baking and Pastry', sort_order: 3, lessons: [
      { title: 'Baking Science', duration: 90 },
      { title: 'Yeast Breads and Rolls', duration: 120 },
      { title: 'Pastries and Desserts', duration: 120 },
    ]},
    { title: 'Module 4: Professional Development', sort_order: 4, lessons: [
      { title: 'Menu Planning and Cost Control', duration: 90 },
      { title: 'Nutrition and Special Diets', duration: 60 },
      { title: 'Restaurant Operations', duration: 90 },
    ]},
  ]
};

async function seedCourse(courseData) {
  console.log(`\n=== Seeding: ${courseData.title} ===`);
  
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: courseData.title,
      slug: courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now(),
      description: courseData.description,
      category: courseData.category,
      duration_hours: courseData.duration_hours,
      passing_score: courseData.passing_score,
      status: courseData.status,
    })
    .select('id')
    .single();

  if (courseError || !course) {
    console.error('Failed to create course:', courseError);
    return null;
  }
  console.log(`Created course: ${course.id}`);

  for (const mod of courseData.modules) {
    const { data: module, error: modErr } = await supabase
      .from('course_modules')
      .insert({ course_id: course.id, title: mod.title, sort_order: mod.sort_order })
      .select('id')
      .single();

    if (modErr || !module) {
      console.error('Failed to create module:', modErr);
      continue;
    }

    for (let i = 0; i < mod.lessons.length; i++) {
      const lesson = mod.lessons[i];
      await supabase.from('course_lessons').insert({
        module_id: module.id,
        title: lesson.title,
        lesson_number: i + 1,
        duration_minutes: lesson.duration || 60,
        content: `<h2>${lesson.title}</h2><p>Content for ${lesson.title} - aligned with industry standards and DOL requirements.</p>`,
      });
    }
    console.log(`  Module "${mod.title}": ${mod.lessons.length} lessons`);
  }

  return course.id;
}

async function main() {
  console.log('Seeding Apprenticeship Courses...');
  
  const courses = [
    BARBER_COURSE,
    COSMETOLOGY_COURSE,
    ESTHETICIAN_COURSE,
    NAIL_TECHNICIAN_COURSE,
    CULINARY_COURSE,
  ];

  for (const course of courses) {
    await seedCourse(course);
  }

  console.log('\n=== Seeding Complete ===');
}

main().catch(console.error);
