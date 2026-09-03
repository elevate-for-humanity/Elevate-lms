-- ============================================================================
-- PROGRAMS SEED DATA - Copy/Paste Ready
-- ============================================================================
-- Seeds the programs table with 6 humanized workforce training programs
-- Run this AFTER running the migration: 20251205_programs_complete.sql
-- ============================================================================

-- Clear existing data
TRUNCATE programs CASCADE;

-- Insert HVAC Technician Training
INSERT INTO programs (
  slug, name, short_tagline, hero_image, hero_image_alt,
  level, duration, format, schedule, tuition_notes,
  funding_options, who_it_is_for, outcomes, highlights,
  cta_primary_label, cta_primary_href,
  cta_secondary_label, cta_secondary_href,
  is_active, is_featured, display_order
) VALUES (
  'hvac-technician',
  'HVAC Technician Training',
  'Learn to keep homes, schools, and businesses comfortable year-round.',
  '/programs/hvac-hero.jpg',
  'Student working on an HVAC unit with an instructor.',
  'Entry to Intermediate',
  '12–20 weeks (varies by schedule)',
  'Hybrid: hands-on labs + online theory',
  'Evening and weekend options available in most cohorts',
  'Tuition can often be covered through WIOA, Workforce grants, or employer sponsorship.',
  ARRAY[
    'WIOA / Workforce board funding (where approved)',
    'State & regional workforce grants',
    'Employer or apprenticeship sponsorship',
    'Payment plan options available in some locations'
  ],
  ARRAY[
    'Adult learners ready for a skilled trade with strong earning potential',
    'People who like working with their hands, tools, and problem-solving',
    'Career changers coming from retail, hospitality, warehouse, or low-wage work'
  ],
  ARRAY[
    'Graduate with the skills to work as an entry-level HVAC technician or apprentice',
    'Learn fundamentals of heating, ventilation, air conditioning, and refrigeration',
    'Gain experience reading gauges, troubleshooting common issues, and working safely',
    'Prepare for industry-recognized credentials where available (varies by partner site)'
  ],
  ARRAY[
    'Hands-on labs with real HVAC equipment',
    'Career coaching and job search support',
    'Stackable with other building trades and maintenance programs',
    'Designed to align with local employer needs and apprenticeship pathways'
  ],
  'Apply for HVAC Training',
  '/apply?program=hvac-technician',
  'Request HVAC Info Session',
  '/contact?topic=hvac-technician',
  true,
  true,
  1
);

-- Insert Barber Apprenticeship
INSERT INTO programs (
  slug, name, short_tagline, hero_image, hero_image_alt,
  level, duration, format, schedule, tuition_notes,
  funding_options, who_it_is_for, outcomes, highlights,
  cta_primary_label, cta_primary_href,
  cta_secondary_label, cta_secondary_href,
  is_active, is_featured, display_order
) VALUES (
  'barber-apprenticeship',
  'Barber Apprenticeship Pathway',
  'Earn while you learn in a licensed barber shop environment.',
  '/programs/barber-hero.jpg',
  'Apprentice barber practicing a fade on a client.',
  'Entry-Level Apprenticeship',
  '2,000 hours (typically 1–2 years)',
  'On-the-job apprenticeship + related classroom instruction',
  'Flexible schedules set with your sponsoring shop',
  'Many apprenticeship hours are paid. Some related instruction may be grant or employer funded.',
  ARRAY[
    'Registered apprenticeship and OJT support where available',
    'Workforce and apprenticeship grants (varies by region)',
    'Employer-sponsored training hours'
  ],
  ARRAY[
    'Future barbers who want a real shop experience, not just a classroom',
    'Creatives who love hair, conversation, and community',
    'Individuals who want to build a long-term career and potentially own a shop'
  ],
  ARRAY[
    'Complete 2,000 hours of structured barber apprenticeship training',
    'Gain real client experience with supervision and coaching',
    'Prepare to meet state licensing or examination requirements (varies by state)',
    'Build a strong professional portfolio and client base while in training'
  ],
  ARRAY[
    'Learn fades, shaves, beard work, and customer service skills',
    'On-the-job mentoring from experienced barbers and shop owners',
    'Career and financial literacy support (pricing, clientele, shop ownership basics)',
    'Apprenticeship hours tracked and aligned with state regulations where applicable'
  ],
  'Start Barber Apprenticeship',
  '/apply?program=barber-apprenticeship',
  'Talk with a Barber Pathway Coach',
  '/contact?topic=barber-apprenticeship',
  true,
  true,
  2
);

-- Insert CNA Training
INSERT INTO programs (
  slug, name, short_tagline, hero_image, hero_image_alt,
  level, duration, format, schedule, tuition_notes,
  funding_options, who_it_is_for, outcomes, highlights,
  cta_primary_label, cta_primary_href,
  cta_secondary_label, cta_secondary_href,
  is_active, is_featured, display_order
) VALUES (
  'cna-training',
  'Certified Nursing Assistant (CNA) Training',
  'Step into healthcare with a high-impact, high-demand CNA credential.',
  '/programs/cna-hero.jpg',
  'CNA student practicing vital signs on a manikin.',
  'Entry-Level Healthcare',
  '4–8 weeks (varies by partner school)',
  'Classroom, skills lab, and clinical experience',
  'Day, evening, or weekend cohorts where available',
  'CNA training is often fully covered by workforce funding, healthcare employers, or scholarships.',
  ARRAY[
    'Workforce board funding (WIOA/ETPL where approved)',
    'Hospital, long-term care, or agency sponsorships',
    'Scholarships and healthcare initiative funding'
  ],
  ARRAY[
    'Compassionate people ready to serve patients and residents',
    'Adults exploring healthcare careers like LPN, RN, or medical assistant',
    'Career changers seeking stable, in-demand work with impact'
  ],
  ARRAY[
    'Complete state-approved CNA training with classroom, lab, and clinical hours',
    'Prepare to sit for the CNA exam in your state (where offered through partners)',
    'Build confidence in direct patient care, communication, and safety',
    'Open doors to hospitals, long-term care, home health, and more'
  ],
  ARRAY[
    'Small cohort sizes and supportive instructors (through partner schools)',
    'Practice with equipment and real-world scenarios before clinicals',
    'Job search and resume support focused on healthcare roles',
    'Stackable toward additional healthcare credentials over time'
  ],
  'Apply for CNA Training',
  '/apply?program=cna-training',
  'Ask About CNA Funding',
  '/contact?topic=cna-training',
  true,
  true,
  3
);

-- Insert Building Technician
INSERT INTO programs (
  slug, name, short_tagline, hero_image, hero_image_alt,
  level, duration, format, schedule, tuition_notes,
  funding_options, who_it_is_for, outcomes, highlights,
  cta_primary_label, cta_primary_href,
  cta_secondary_label, cta_secondary_href,
  is_active, is_featured, display_order
) VALUES (
  'building-technician',
  'Building Technician & Maintenance',
  'Learn the skills to keep buildings safe, clean, and operating smoothly.',
  '/programs/building-tech-hero.jpg',
  'Building maintenance trainee using tools in a facility.',
  'Entry to Intermediate',
  '10–16 weeks (varies by program partner)',
  'Hands-on labs + online modules',
  'Day or evening cohorts where available',
  'Frequently eligible for workforce and employer-sponsored funding.',
  ARRAY[
    'Workforce board / WIOA funding (where approved)',
    'Public housing, facilities, and employer sponsorships',
    'Grants focused on building trades and infrastructure'
  ],
  ARRAY[
    'Problem-solvers who enjoy hands-on work, tools, and variety',
    'Individuals interested in facilities, property management, or trades',
    'People who want stable, year-round work with growth potential'
  ],
  ARRAY[
    'Understand core building systems (basic electrical, plumbing, HVAC support, safety)',
    'Gain experience with routine maintenance, inspections, and work orders',
    'Learn professional communication with residents, tenants, and supervisors',
    'Prepare for roles in facilities, housing authorities, schools, and more'
  ],
  ARRAY[
    'Cross-training that connects to HVAC and building systems',
    'Real-world maintenance projects and simulations',
    'Career coaching for facilities and property roles',
    'Stackable with other Elevate trades and technical pathways'
  ],
  'Apply for Building Technician Training',
  '/apply?program=building-technician',
  'Request Building Technician Info',
  '/contact?topic=building-technician',
  true,
  false,
  4
);

-- Insert CDL & Transportation
INSERT INTO programs (
  slug, name, short_tagline, hero_image, hero_image_alt,
  level, duration, format, schedule, tuition_notes,
  funding_options, who_it_is_for, outcomes, highlights,
  cta_primary_label, cta_primary_href,
  cta_secondary_label, cta_secondary_href,
  is_active, is_featured, display_order
) VALUES (
  'cdl-and-transport',
  'CDL & Transportation Careers',
  'Get on the road to a transportation career with strong earning potential.',
  '/programs/cdl-hero.jpg',
  'CDL student near a commercial truck with an instructor.',
  'Entry-Level Transportation',
  'Varies by partner school and license class',
  'Classroom, simulation, and behind-the-wheel training (through partners)',
  'Intensive or part-time schedules depending on provider',
  'Many learners qualify for workforce funding or employer sponsorship.',
  ARRAY[
    'Workforce board funding where CDL programs are approved',
    'Employer or carrier sponsorship programs',
    'Veteran and special initiative funding where available'
  ],
  ARRAY[
    'Adults ready to travel, drive, and work independently',
    'People seeking a path to higher earning potential in transportation',
    'Career changers coming from warehouse, labor, or service roles'
  ],
  ARRAY[
    'Connect with partner schools that provide CDL training',
    'Receive support with applications, funding, and next steps',
    'Prepare for in-demand roles in transportation and logistics',
    'Build a plan for long-term career growth, not just a one-time license'
  ],
  ARRAY[
    'Guidance on matching you with the right CDL program and provider',
    'Support navigating funding, sponsorships, and paperwork',
    'Career coaching around lifestyle, routes, and long-term goals',
    'Connections to broader Elevate workforce services beyond CDL'
  ],
  'Start CDL & Transport Pathway',
  '/apply?program=cdl-and-transport',
  'Talk with a Transportation Coach',
  '/contact?topic=cdl-and-transport',
  true,
  false,
  5
);

-- Insert Career Readiness
INSERT INTO programs (
  slug, name, short_tagline, hero_image, hero_image_alt,
  level, duration, format, schedule, tuition_notes,
  funding_options, who_it_is_for, outcomes, highlights,
  cta_primary_label, cta_primary_href,
  cta_secondary_label, cta_secondary_href,
  is_active, is_featured, display_order
) VALUES (
  'career-readiness',
  'Career Readiness & Life Design',
  'Build confidence, clarity, and a plan for your next chapter.',
  '/programs/career-readiness-hero.jpg',
  'Adult learners in a workshop, working together at a table.',
  'All Levels',
  '2–8 weeks (varies by cohort and partner)',
  'Workshops, coaching, and online tools',
  'Flexible formats, including evenings and community-based sessions',
  'Often grant-funded or provided at no cost to the learner through partners.',
  ARRAY[
    'Workforce grants and community-based funding',
    'Partner organization sponsorship',
    'Embedded within other Elevate training pathways'
  ],
  ARRAY[
    'Adults who feel stuck and want a clear next step',
    'People re-entering the workforce after a break or transition',
    'Learners who want help with resumes, interviews, and confidence'
  ],
  ARRAY[
    'Create a realistic career and training plan that fits your life',
    'Build a resume that actually tells your story and skills',
    'Practice interview skills and real-world conversations',
    'Learn how to stack credentials and move into higher-wage roles'
  ],
  ARRAY[
    'Human, judgment-free coaching and community support',
    'Tools designed for real barriers (childcare, transportation, confidence)',
    'Connections to Elevate programs and partner opportunities',
    'Can be bundled with trades, healthcare, or apprenticeship pathways'
  ],
  'Join a Career Readiness Cohort',
  '/apply?program=career-readiness',
  'Ask About Upcoming Workshops',
  '/contact?topic=career-readiness',
  true,
  false,
  6
);

-- Verify data
SELECT 
  slug, 
  name, 
  level, 
  is_active, 
  is_featured,
  display_order
FROM programs
ORDER BY display_order;
