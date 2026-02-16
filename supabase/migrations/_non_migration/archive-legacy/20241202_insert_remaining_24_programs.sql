-- Remaining 24 Programs (4-27)
-- Continuation of complete program data

-- 4. Barber / Cosmetology
INSERT INTO public.programs (
  slug, name, description, full_description, category, duration_weeks, training_hours,
  salary_min, salary_max, credential_type, credential_name, delivery_method,
  what_you_learn, day_in_life, employers, funding_pathways, career_outcomes,
  industry_demand, prerequisites, image_url, featured, wioa_approved, dol_registered,
  placement_rate, completion_rate, total_cost, toolkit_cost, credentialing_cost, is_active
) VALUES (
  'barber-cosmetology',
  'Barber / Cosmetology',
  'Master the art of barbering and cosmetology. State license included.',
  'Our Barber/Cosmetology program provides comprehensive training in hair cutting, styling, coloring, and chemical treatments. You''ll learn business management, customer service, and salon operations. The program meets all state board requirements and prepares you for licensure. Hands-on training in our student salon gives you real-world experience with paying clients before graduation.',
  'Personal Services',
  40,
  1500,
  25000,
  55000,
  'State License',
  'Licensed Barber / Cosmetologist',
  'In-Person (Classroom + Salon)',
  ARRAY[
    'Hair cutting and styling techniques',
    'Hair coloring and chemical treatments',
    'Shaving and facial grooming',
    'Scalp and hair treatments',
    'Sanitation and safety protocols',
    'Customer consultation and communication',
    'Salon business management',
    'Product knowledge and retail sales'
  ],
  'Your day in the salon starts with preparing your station and reviewing appointments. You''ll consult with clients about their desired look, recommend styles and treatments, and execute precision cuts and colors. Between clients, you''ll sanitize tools, mix color formulas, and maintain your workspace. You''ll build relationships with regular clients, stay current on trends, and continuously refine your craft. The creative work is rewarding, and tips can significantly boost your income.',
  ARRAY[
    'Barbershops and salons',
    'Spas and resorts',
    'Cruise ships and entertainment venues',
    'Film and television production',
    'Self-employment / booth rental',
    'Product sales and education'
  ],
  ARRAY['WIOA', 'Pell Grant', 'Private Student Loans', 'Payment Plans'],
  ARRAY[
    'Licensed barber or cosmetologist',
    'Salon ownership and management',
    'Platform artist and educator',
    'Celebrity and editorial stylist',
    'Product development and sales'
  ],
  'The beauty industry generates over $50 billion annually. Demand for skilled professionals remains strong with flexible schedules and entrepreneurial opportunities. Many professionals earn $50,000+ with tips and commission.',
  'High school diploma or GED, age 16+, background check',
  '/images/programs/barber.jpg',
  true,
  true,
  false,
  87,
  82,
  12000.00,
  1500.00,
  200.00,
  true
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

-- 5. Welding
INSERT INTO public.programs (
  slug, name, description, full_description, category, duration_weeks, training_hours,
  salary_min, salary_max, credential_type, credential_name, delivery_method,
  what_you_learn, day_in_life, employers, funding_pathways, career_outcomes,
  industry_demand, prerequisites, image_url, featured, wioa_approved, dol_registered,
  placement_rate, completion_rate, total_cost, toolkit_cost, credentialing_cost, is_active
) VALUES (
  'welding',
  'Welding',
  'Learn multiple welding processes and earn AWS certification.',
  'Our Welding program teaches you MIG, TIG, Stick, and Flux-Core welding processes. You''ll work with various metals, learn blueprint reading, and master welding safety. The program prepares you for AWS (American Welding Society) certification and includes extensive hands-on practice in our welding lab. Graduates are qualified for high-paying positions in manufacturing, construction, and fabrication.',
  'Skilled Trades',
  20,
  800,
  35000,
  65000,
  'AWS Certification',
  'AWS Certified Welder',
  'In-Person (Lab-Based)',
  ARRAY[
    'MIG, TIG, Stick, and Flux-Core welding',
    'Blueprint reading and interpretation',
    'Metal properties and metallurgy',
    'Welding safety and PPE',
    'Cutting and fabrication techniques',
    'Weld inspection and quality control',
    'Pipe welding and structural welding',
    'Welding codes and standards'
  ],
  'As a welder, you''ll start your day by reviewing blueprints and preparing materials. You''ll set up your welding equipment, select the appropriate process and settings, and execute precise welds on metal components. Throughout the day, you''ll work on various projects - from structural steel to pipe systems. You''ll inspect your work for quality, grind and finish welds, and maintain your equipment. The work requires focus, skill, and attention to detail, with the satisfaction of creating strong, lasting structures.',
  ARRAY[
    'Manufacturing plants',
    'Construction companies',
    'Shipyards and marine facilities',
    'Automotive and aerospace industries',
    'Pipeline and energy companies',
    'Fabrication shops'
  ],
  ARRAY['WIOA', 'Apprenticeship', 'Workforce Ready Grant', 'Employer Sponsorship'],
  ARRAY[
    'Entry-level welder positions',
    'Certified welder in specialized processes',
    'Welding inspector and quality control',
    'Welding supervisor or foreman',
    'Welding instructor or trainer'
  ],
  'Welding is a high-demand skilled trade with 3% projected growth. Infrastructure projects and manufacturing expansion create consistent opportunities. Specialized welders (underwater, pipeline) can earn $80,000+.',
  'High school diploma or GED, good vision, steady hands, ability to lift 50+ lbs',
  '/images/programs/welding.jpg',
  true,
  true,
  true,
  90,
  86,
  5000.00,
  1000.00,
  400.00,
  true
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

-- 6. Electrician
INSERT INTO public.programs (
  slug, name, description, full_description, category, duration_weeks, training_hours,
  salary_min, salary_max, credential_type, credential_name, delivery_method,
  what_you_learn, day_in_life, employers, funding_pathways, career_outcomes,
  industry_demand, prerequisites, image_url, featured, wioa_approved, dol_registered,
  placement_rate, completion_rate, total_cost, toolkit_cost, credentialing_cost, is_active
) VALUES (
  'electrician',
  'Electrician',
  'Start your electrical career with residential and commercial training.',
  'Our Electrician program provides foundational training in electrical theory, wiring, and installation. You''ll learn the National Electrical Code (NEC), circuit design, and troubleshooting techniques. The program includes hands-on practice with residential and commercial electrical systems, preparing you for apprenticeship or entry-level positions. This is the first step toward becoming a licensed electrician.',
  'Skilled Trades',
  24,
  960,
  40000,
  75000,
  'Certificate',
  'Electrical Pre-Apprentice Certificate',
  'Hybrid (Classroom + Lab)',
  ARRAY[
    'Electrical theory and fundamentals',
    'National Electrical Code (NEC)',
    'Residential wiring and installation',
    'Commercial electrical systems',
    'Circuit design and load calculations',
    'Troubleshooting and diagnostics',
    'Safety protocols and OSHA compliance',
    'Blueprint reading and schematics'
  ],
  'Your day as an electrician starts with reviewing job plans and gathering materials. You''ll install wiring, outlets, and fixtures in new construction or troubleshoot problems in existing systems. You''ll use specialized tools to test circuits, identify issues, and make repairs. Throughout the day, you''ll work independently or with a team, following electrical codes and safety procedures. You''ll interact with contractors, homeowners, and inspectors. The work is technical, problem-solving, and essential to modern life.',
  ARRAY[
    'Electrical contractors',
    'Construction companies',
    'Facilities maintenance departments',
    'Manufacturing plants',
    'Utilities and power companies',
    'Self-employment opportunities'
  ],
  ARRAY['WIOA', 'Apprenticeship', 'Workforce Ready Grant', 'Union Sponsorship'],
  ARRAY[
    'Electrical apprentice positions',
    'Advancement to journeyman electrician',
    'Master electrician license',
    'Electrical contractor and business owner',
    'Electrical inspector or code official'
  ],
  'Electricians are in high demand with 7% projected growth. Renewable energy, electric vehicles, and smart home technology create new opportunities. Median pay is $60,040 with top earners making $99,800+.',
  'High school diploma or GED, good math skills, color vision, valid driver''s license',
  '/images/programs/electrician.jpg',
  true,
  true,
  true,
  88,
  84,
  5500.00,
  900.00,
  250.00,
  true
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

-- 7. Plumbing
INSERT INTO public.programs (
  slug, name, description, full_description, category, duration_weeks, training_hours,
  salary_min, salary_max, credential_type, credential_name, delivery_method,
  what_you_learn, day_in_life, employers, funding_pathways, career_outcomes,
  industry_demand, prerequisites, image_url, featured, wioa_approved, dol_registered,
  placement_rate, completion_rate, total_cost, toolkit_cost, credentialing_cost, is_active
) VALUES (
  'plumbing',
  'Plumbing',
  'Learn residential and commercial plumbing systems.',
  'Our Plumbing program teaches you to install, maintain, and repair water supply and drainage systems. You''ll learn pipe fitting, fixture installation, and plumbing codes. The program includes hands-on training with modern plumbing materials and techniques, preparing you for apprenticeship or entry-level positions in this essential skilled trade.',
  'Skilled Trades',
  20,
  800,
  38000,
  70000,
  'Certificate',
  'Plumbing Pre-Apprentice Certificate',
  'Hybrid (Classroom + Lab)',
  ARRAY[
    'Plumbing systems and components',
    'Pipe fitting and installation',
    'Fixture installation and repair',
    'Drainage and venting systems',
    'Water supply systems',
    'Plumbing codes and regulations',
    'Blueprint reading',
    'Safety and tool usage'
  ],
  'As a plumber, you''ll start your day by reviewing service calls or installation plans. You''ll visit homes and businesses to install new plumbing systems, repair leaks, clear clogs, or replace fixtures. You''ll use specialized tools to cut, thread, and join pipes, test systems for leaks, and ensure code compliance. Each job presents unique challenges requiring problem-solving skills. You''ll interact with customers, explain issues, and provide solutions. The work is hands-on, varied, and always in demand.',
  ARRAY[
    'Plumbing contractors',
    'Construction companies',
    'Property management companies',
    'Facilities maintenance',
    'Utilities and municipalities',
    'Self-employment'
  ],
  ARRAY['WIOA', 'Apprenticeship', 'Workforce Ready Grant', 'Union Sponsorship'],
  ARRAY[
    'Plumbing apprentice',
    'Journeyman plumber',
    'Master plumber license',
    'Plumbing contractor',
    'Plumbing inspector'
  ],
  'Plumbing is a recession-resistant trade with 2% projected growth. New construction and aging infrastructure create consistent demand. Median pay is $59,880 with experienced plumbers earning $90,000+.',
  'High school diploma or GED, physical fitness, valid driver''s license',
  '/images/programs/plumbing.jpg',
  false,
  true,
  true,
  86,
  83,
  4800.00,
  850.00,
  200.00,
  true
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

-- 8. Carpentry
INSERT INTO public.programs (
  slug, name, description, full_description, category, duration_weeks, training_hours,
  salary_min, salary_max, credential_type, credential_name, delivery_method,
  what_you_learn, day_in_life, employers, funding_pathways, career_outcomes,
  industry_demand, prerequisites, image_url, featured, wioa_approved, dol_registered,
  placement_rate, completion_rate, total_cost, toolkit_cost, credentialing_cost, is_active
) VALUES (
  'carpentry',
  'Carpentry',
  'Master residential and commercial carpentry skills.',
  'Our Carpentry program teaches you framing, finish work, and construction techniques. You''ll learn to read blueprints, use power tools safely, and build structures from foundation to roof. The program includes hands-on projects building real structures, preparing you for apprenticeship or entry-level positions in residential and commercial construction.',
  'Skilled Trades',
  24,
  960,
  35000,
  65000,
  'Certificate',
  'Carpentry Pre-Apprentice Certificate',
  'In-Person (Lab-Based)',
  ARRAY[
    'Framing and structural carpentry',
    'Finish carpentry and trim work',
    'Blueprint reading and layout',
    'Power tool operation and safety',
    'Building codes and standards',
    'Concrete and foundation work',
    'Roofing and siding installation',
    'Cabinet and furniture making'
  ],
  'Your day as a carpenter starts early on the job site. You''ll review plans, measure and mark materials, and cut lumber to precise specifications. You''ll frame walls, install joists, and build structures using hand and power tools. Throughout the day, you''ll work with a crew, problem-solve construction challenges, and ensure quality workmanship. You''ll see your work take shape from foundation to finished building. The work is physical, creative, and rewarding.',
  ARRAY[
    'Construction companies',
    'Home builders',
    'Remodeling contractors',
    'Commercial construction firms',
    'Facilities maintenance',
    'Self-employment'
  ],
  ARRAY['WIOA', 'Apprenticeship', 'Workforce Ready Grant', 'Union Sponsorship'],
  ARRAY[
    'Carpenter apprentice',
    'Journeyman carpenter',
    'Construction supervisor',
    'General contractor',
    'Custom furniture maker'
  ],
  'Carpentry has 2% projected growth with consistent demand in residential and commercial construction. Median pay is $48,260 with experienced carpenters earning $80,000+.',
  'High school diploma or GED, physical fitness, good math skills, valid driver''s license',
  '/images/programs/carpentry.jpg',
  false,
  true,
  true,
  85,
  81,
  4500.00,
  1200.00,
  150.00,
  true
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

-- Continue with programs 9-27 in next section...
