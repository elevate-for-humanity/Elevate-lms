-- Add all ETPL-approved programs to Elevate for Humanity
-- Programs from Indiana ETPL database + certifications
-- Run this in Supabase SQL Editor

-- Insert all new programs
INSERT INTO public.programs (slug, title, tagline, description, summary, bullets, funding, hero_image) VALUES

-- 1. Business Start-Up & Marketing Program
(
  'business-startup-marketing',
  'Business Start-Up & Marketing Program',
  'Launch your own business with Rise Forward',
  'The Business Start-Up & Marketing Program with Rise Forward equips participants with hands-on skills to launch their own business ventures. Students will learn the fundamentals of entrepreneurship, digital marketing, LLC formation, business planning, customer service, and resume development. The program includes guided startup support, mentorship, and ends with a business match stipend and laptop kit to empower real-world implementation. Ideal for youth ready to explore self-employment and leadership pathways in today''s economy.',
  'Learn entrepreneurship, digital marketing, LLC formation, and business planning with mentorship and startup support.',
  ARRAY[
    '5-week accelerated program',
    '32 instructional hours (8 hours/week)',
    'LLC formation and business planning',
    'Digital marketing and customer service',
    'Business match stipend + laptop kit',
    'Resume development and professional branding',
    '100% online, flexible schedule',
    'Open to youth ages 16+'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/business-startup.jpg'
),

-- 2. Emergency Health & Safety Technician
(
  'emergency-health-safety-tech',
  'Emergency Health & Safety Technician',
  'Life-saving skills through DOL Federally Registered Apprenticeship',
  'The Emergency Health & Safety Technician is a DOL Federally Registered Apprenticeship that prepares individuals for life-saving response roles in schools, workplaces and emergency settings. This hybrid (time-based and competency-based) apprenticeship includes CPR, OSHA 10, and Emergency Medical Responder (EMR) training. Students graduate with nationally recognized certifications and are equipped for careers in healthcare, public safety, community response, and entry-level emergency technician pathways. Instruction provided by Sharen Douglas-Brown.',
  'Earn OSHA 10, CPR, and EMR certifications in 4-week DOL Registered Apprenticeship.',
  ARRAY[
    'DOL Federally Registered Apprenticeship',
    'Hybrid: Time-based and Competency-based',
    '4-week program (4 weeks RTI)',
    '80 instructional hours (20 hours/week)',
    '20% instructor-led, 40% lab/field, 40% self-study',
    '60% available online',
    'In-person, online, e-learning, and distance learning',
    'RAPIDS system verified',
    'Currently 1 active apprentice',
    'Earn OSHA 10 - Career Safe certification',
    'Earn CPR certification',
    'Earn Emergency Medical Responder (EMR) certification',
    'Public health emergency awareness',
    'Instruction by Sharen Douglas-Brown',
    'High school diploma or GED required',
    '100% admission rate',
    'Day, evening, weekend, and online options',
    'Career counseling and job placement included'
  ],
  ARRAY['WIOA', 'WRG', 'Apprenticeship'],
  '/images/emergency-health-safety.jpg'
),

-- 3. HVAC Technician
(
  'hvac-technician',
  'HVAC Technician',
  'DOL Federally Registered Apprenticeship in HVAC',
  'The HVAC Technician program is a DOL Federally Registered Apprenticeship that provides comprehensive training in heating, ventilation, air conditioning, and refrigeration systems. This hybrid (time-based and competency-based) apprenticeship includes 50 weeks of Related Technical Instruction combined with on-the-job training. Students earn multiple industry-recognized certifications including CPR, Rise Up Credential, OSHA 30, and two Residential HVAC Certifications. The program prepares apprentices for careers in residential and commercial HVAC installation, maintenance, and repair.',
  'Earn 5 certifications in DOL Registered HVAC Apprenticeship with 10 active apprentices.',
  ARRAY[
    'DOL Federally Registered Apprenticeship',
    'Hybrid: Time-based and Competency-based',
    '50 weeks of Related Technical Instruction (RTI)',
    '125 instructional hours (12 hours/week)',
    '10% instructor-led, 5% lab/field, 85% self-study',
    '30% available online',
    'In-person, online, e-learning, and distance learning',
    'RAPIDS system verified',
    'Currently 10 active apprentices',
    'Earn CPR certification',
    'Earn Rise Up Credential',
    'Earn OSHA 30 certification',
    'Earn Residential HVAC Certification 1',
    'Earn Residential HVAC Certification 2 - Refrigeration Diagnostics',
    'Accredited program',
    'No prerequisites',
    '100% admission rate',
    'Day, evening, weekend, and online options',
    'Career counseling and job placement included'
  ],
  ARRAY['WIOA', 'WRG', 'Apprenticeship'],
  '/images/hvac-technician.jpg'
),

-- 4. Direct Support Professional (DSP)
(
  'direct-support-professional',
  'Direct Support Professional (DSP)',
  'Compassionate care for individuals with developmental needs',
  'Our Direct Support Professional (DSP) training program is built to prepare compassionate individuals for meaningful work in the care and support field. This program offers hands-on instruction, real-world scenarios, and practical skills that help students feel confident working with individuals who have developmental, physical, or emotional needs. Whether you''re starting a new career or looking to grow in the healthcare field, this training gives you the tools to make a real difference in someone''s life while also building a rewarding future for yourself.',
  'Prepare for a rewarding career supporting individuals with developmental, physical, or emotional needs.',
  ARRAY[
    'Rolling enrollment - start anytime',
    'Cohorts begin 1st and 15th of each month',
    'Hands-on instruction and real-world scenarios',
    'No prior healthcare experience required',
    'Must be 18+ with high school diploma or GED',
    'Background check required',
    'Job placement assistance included',
    'CDSP, CNA, or QIDP pathway'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/dsp.jpg'
),

-- 5. Professional Esthetician & Client Services
(
  'professional-esthetician',
  'Professional Esthetician & Client Services Career Program',
  'Job-ready skincare and spa skills through DOL Federally Registered Apprenticeship',
  'The Esthetics and Skincare Specialist Certificate Program is a DOL Federally Registered Apprenticeship that prepares individuals to enter the high-demand personal care industry with job-ready skills in skin analysis, facial treatments, hair removal, sanitation, customer service, and product knowledge. This comprehensive hybrid (time-based and competency-based) apprenticeship blends hands-on instruction with theory-based modules, empowering students to build confidence in a professional spa setting. This RAPIDS-verified program offers traditional wrap around support including career readiness, business startup training, wellness coaching and access to employer networks.',
  'Master skincare, facial treatments, and client services in 5 weeks through DOL Registered Apprenticeship.',
  ARRAY[
    'DOL Federally Registered Apprenticeship',
    'Hybrid: Time-based and Competency-based',
    '5-week program (4 weeks RTI)',
    '60 instructional hours (15 hours/week)',
    '30% instructor-led, 10% lab/field, 60% self-study',
    '60% available online',
    'In-person, online, e-learning, and distance learning',
    'RAPIDS system verified',
    'Currently 3 active apprentices',
    'Earn OSHA 10 - Career Safe certification',
    'Customer Service and Sales Certified Specialist',
    'Business of Retail Certified Specialist',
    'Skin analysis and facial treatments',
    'Hair removal and makeup fundamentals',
    'Sanitation and infection control',
    'Career readiness and business startup training',
    'Wellness coaching and employer networks',
    'No prerequisites - all ages welcome',
    '60% admission rate',
    'Day, evening, weekend, and online options',
    'Job placement and career counseling included'
  ],
  ARRAY['WIOA', 'WRG', 'Apprenticeship'],
  '/images/esthetician.jpg'
),

-- 6. Tax Preparation & Financial Services (State Certified Earn and Learn)
(
  'tax-prep-financial-services',
  'Tax Preparation & Financial Services Certificate',
  'State Certified Earn and Learn program with IRS VITA/TCE certification',
  'The Tax Preparation & Financial Services Certificate is a State Certified Earn and Learn program (certified 2025-10-01) that prepares individuals to understand federal and state taxation concepts and apply them in real-world settings. Participants complete training in tax law, return preparation, bookkeeping, and financial literacy, culminating in the IRS VITA/TCE certification. The program combines classroom instruction, online modules, and supervised practicum hours at an IRS-approved VITA site. Students earn QuickBooks Pro Advisor and Microsoft 365 Fundamentals certifications, plus the Rise Up Credential. Graduates gain the skills required for employment as Tax Preparers, Bookkeeping Assistants, and Financial Service Specialists in both private and community-based environments.',
  'Earn IRS VITA/TCE, QuickBooks, Microsoft 365, and Rise Up certifications in State Certified Earn and Learn program.',
  ARRAY[
    'State Certified Earn and Learn (certified 2025-10-01)',
    '10-week comprehensive program',
    '150 instructional hours (15 hours/week)',
    'In-person, online, e-learning, and distance learning',
    'Earn QuickBooks Pro Advisor certification',
    'Earn Microsoft 365 Fundamentals certification',
    'Earn Rise Up Credential',
    'IRS VITA/TCE certification included',
    'Federal and state tax law training',
    'Bookkeeping and financial literacy',
    'Supervised practicum at IRS-approved VITA site',
    '50% online, 50% instructor-led, 25% lab work',
    'High school diploma or GED required'
  ],
  ARRAY['WIOA', 'WRG', 'Earn and Learn'],
  '/images/tax-prep.jpg'
),

-- 7. Public Safety Reentry Specialist
(
  'public-safety-reentry-specialist',
  'Public Safety Reentry Specialist Program',
  'Career pathways for justice-involved individuals',
  'This program directly supports the critical shortage in Indiana''s behavioral health, reentry, and public safety workforce by training Peer Recovery Specialists with a trauma-informed lens. Aligned with O*NET Code 21-1093.00 (Social and Human Service Assistants), this certification-based program prepares justice-impacted individuals and others to provide frontline recovery, crisis response, and peer coaching services. The hybrid format makes it accessible to underserved and returning citizens, meeting urgent workforce demands in correctional reentry, workforce coaching, community outreach, and peer navigation roles. This program is designed to be inclusive and accessible to all learners—regardless of age, background, or education level. It welcomes youth ages 16+, adults seeking career change, justice-involved individuals reentering the workforce, and those receiving support through SNAP, WIOA, or other public assistance programs. No prior credential or diploma is required for enrollment. We provide built-in support, including tutoring, digital literacy training, and guided instruction to ensure all participants have the tools they need to succeed.',
  'Trauma-informed Peer Recovery Specialist training for justice-impacted individuals and reentry professionals.',
  ARRAY[
    '45-day intensive program',
    '180 instructional hours (15 hours/week)',
    'O*NET 21-1093.00 - Social and Human Service Assistants',
    'Certified Peer Recovery Specialist (CPRS) pathway',
    'Trauma-informed coaching and mentorship',
    'Crisis response and peer navigation',
    'Correctional reentry and workforce coaching',
    'No prior credential required',
    '100% online with tutoring support',
    '100% acceptance rate for eligible applicants'
  ],
  ARRAY['WIOA', 'JRI'],
  '/images/public-safety-reentry.jpg'
),

-- 8. Barber Apprenticeship Program (Full 2,000-hour)
(
  'barber-apprenticeship-full',
  'Barber Apprenticeship Program',
  'Master barbering through DOL Federally Registered Apprenticeship',
  'The Barber Apprenticeship Program is a comprehensive 2,000-hour DOL Federally Registered Apprenticeship that combines 12 weeks of instructional training with extensive on-the-job training. This hybrid (time-based and competency-based) apprenticeship includes in-person and online instruction. Students learn cutting, styling, shaving, sanitation, and business skills in a real barbershop environment. This RAPIDS-verified apprenticeship prepares participants for Indiana Registered Barber License and provides a pathway to shop ownership or master barber status.',
  'Earn while you learn in a 2,000-hour DOL Federally Registered Apprenticeship.',
  ARRAY[
    'DOL Federally Registered Apprenticeship',
    'Hybrid: Time-based and Competency-based',
    '2,000-hour program (15 weeks total)',
    '12 weeks of Related Technical Instruction (RTI)',
    '40 hours per week',
    '30% instructor-led, 30% lab/field, 40% self-study',
    '40% available online',
    'In-person, online, e-learning, and distance learning',
    'On-the-job training in licensed barbershop',
    'RAPIDS system verified',
    'Currently 3 active apprentices',
    'Earn Registered Barber License',
    'Rise Up Credential included',
    'Business management and shop ownership skills',
    'Paid apprenticeship wages',
    'High school diploma or GED required',
    '10% admission rate (selective)',
    'Day, evening, weekend, and online options'
  ],
  ARRAY['WIOA', 'Apprenticeship'],
  '/images/barber-apprenticeship.jpg'
),

-- 9. Beauty & Career Educator Training Program
(
  'beauty-career-educator',
  'Beauty & Career Educator Training Program',
  'Develop career-ready, technical, and leadership skills in beauty education',
  'The Beauty & Career Educator Training Program offered by Elevate for Humanity is a 12-week hybrid training experience designed to help aspiring beauty professionals and peer educators develop career-ready, technical, and leadership skills. This program includes practical salon service education (manicuring techniques, customer service, sanitation), instructional tools for peer teaching and community workshops, and a strong focus on entrepreneurship and workforce readiness. Participants earn a nationally recognized Rise Up Credential, a Career Readiness Certificate, and a custom Certificate of Completion. Designed for youth and adults ages 16+, this program is aligned with workforce demand for independent contractors, salon educators, and business owners. It is eligible for workforce funding under CIP Code 13.1326 (Career & Technical Education Teaching).',
  'Earn Rise Up Credential + Career Readiness Certificate in 12 weeks.',
  ARRAY[
    '12-week (84-day) hybrid program',
    '144 instructional hours total',
    '12 hours per week',
    '100% offered online',
    'Day, evening, weekend, and online options',
    'CIP 13.1326 - Career & Technical Education Teaching',
    'SOC 25-1194 - Career/Technical Education Teachers',
    'SOC 39-5092 - Manicurists and Pedicurists',
    'Practical salon service education (manicuring, customer service, sanitation)',
    'Peer teaching and community workshop tools',
    'Entrepreneurship and workforce readiness',
    'Rise Up Credential (nationally recognized)',
    'Career Readiness Certificate',
    'Certificate of Completion',
    'Ages 16+ welcome',
    'Pathways: Independent contractors, salon educators, business owners'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/beauty-career-educator.jpg'
),

-- 10. Certified Peer Support Professional
(
  'certified-peer-support-professional',
  'Certified Peer Support Professional',
  'Support others through lived experience',
  'The Certified Peer Support Professional program trains individuals with lived experience in mental health or substance use recovery to provide peer support services. This certification is recognized by behavioral health agencies, hospitals, and community organizations. Participants learn recovery principles, ethical boundaries, trauma-informed care, and advocacy skills.',
  'Become a certified peer support professional and help others in recovery.',
  ARRAY[
    'Industry-recognized certification',
    'Lived experience valued and honored',
    'Recovery principles and ethics',
    'Trauma-informed care training',
    'Advocacy and peer support skills',
    'Recognized by behavioral health agencies',
    'Career pathways in mental health and recovery',
    'Flexible online and in-person options'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/peer-support.jpg'
),

-- 11. Certified Peer Recovery Coach (CPRC)
(
  'certified-peer-recovery-coach',
  'Certified Peer Recovery Coach (CPRC)',
  'Guide others on their recovery journey',
  'The Certified Peer Recovery Coach (CPRC) credential prepares individuals to provide recovery coaching services in substance use and mental health settings. This certification is recognized nationally and qualifies graduates to work in treatment centers, recovery housing, hospitals, and community programs. Training covers motivational interviewing, recovery capital, relapse prevention, and ethical practice.',
  'Earn your CPRC credential and make a difference in recovery services.',
  ARRAY[
    'Nationally recognized CPRC certification',
    'Motivational interviewing techniques',
    'Recovery capital and relapse prevention',
    'Ethical practice and boundaries',
    'Work in treatment centers and recovery housing',
    'Lived experience welcomed',
    'Career pathways in behavioral health',
    'Flexible training schedule'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/peer-recovery-coach.jpg'
),

-- 12. CPR Certification (Standalone)
(
  'cpr-certification',
  'CPR Certification',
  'Life-saving skills in one day',
  'CPR Certification provides essential life-saving skills through American Heart Association or Red Cross training. This standalone certification is required for many healthcare, childcare, fitness, and public safety positions. Participants learn adult, child, and infant CPR, AED use, and choking relief. Certification is valid for 2 years.',
  'Get CPR/AED certified in one day.',
  ARRAY[
    'American Heart Association or Red Cross',
    'Adult, child, and infant CPR',
    'AED use and choking relief',
    'Hands-on practice with manikins',
    'Certification valid for 2 years',
    'Required for many healthcare jobs',
    'Same-day certification card',
    'Flexible class times available'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/cpr-cert.jpg'
),

-- 13. Certified Community Healthcare Worker (CCHW)
(
  'certified-community-healthcare-worker',
  'Certified Community Healthcare Worker (CCHW)',
  'Bridge healthcare gaps in your community',
  'The Certified Community Healthcare Worker (CCHW) program trains individuals to serve as liaisons between healthcare providers and communities. CHWs help patients navigate the healthcare system, provide health education, connect people to resources, and advocate for community health needs. This certification is increasingly recognized by hospitals, clinics, and public health departments.',
  'Become a certified community healthcare worker and improve health outcomes.',
  ARRAY[
    'Industry-recognized CCHW certification',
    'Patient navigation and advocacy',
    'Health education and outreach',
    'Cultural competency training',
    'Resource connection and case management',
    'Work in hospitals, clinics, and public health',
    'Career pathways in community health',
    'No prior healthcare experience required'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/community-healthcare-worker.jpg'
),

-- 14. Rise Up Certificate (with JRI)
(
  'rise-up-certificate',
  'Rise Up Certificate',
  'Foundational skills for career success with Job Ready Indy',
  'The Rise Up Certificate program provides foundational skills for individuals entering or re-entering the workforce. This program covers digital literacy, professional communication, workplace readiness, financial literacy, and personal wellness. Students also complete the Job Ready Indy (JRI) 6-badge series through EmployIndy, earning a nationally recognized workforce readiness credential. Rise Up is designed to prepare participants for further training, apprenticeships, or direct employment. This nationally recognized credential is included in the Beauty & Career Educator Training Program and can also be earned as a standalone certificate.',
  'Build foundational skills and earn Job Ready Indy credential.',
  ARRAY[
    'Nationally recognized certificate',
    'Includes Job Ready Indy (JRI) 6-badge series',
    'Foundational workforce readiness',
    'Digital literacy and computer skills',
    'Professional communication',
    'Financial literacy basics',
    'Personal wellness and goal setting',
    'Pathway to further training or employment',
    'Flexible online format',
    'Open to all ages and backgrounds',
    'Included in Beauty & Career Educator program',
    'EmployIndy JRI Facilitator: Elevate for Humanity'
  ],
  ARRAY['WIOA', 'JRI'],
  '/images/rise-up.jpg'
),

-- 15. OSHA 10 Certification
(
  'osha-10-certification',
  'OSHA 10 Certification',
  'Essential workplace safety training',
  'OSHA 10-Hour General Industry certification provides foundational knowledge of workplace safety and health hazards. This certification is required or preferred for many construction, manufacturing, healthcare, and service industry positions. Participants learn hazard recognition, fall protection, electrical safety, personal protective equipment (PPE), and emergency response. The certification is valid and recognized nationwide.',
  'Get OSHA 10 certified and meet employer safety requirements.',
  ARRAY[
    'OSHA 10-Hour General Industry certification',
    'Workplace safety and health hazards',
    'Hazard recognition and prevention',
    'Fall protection and electrical safety',
    'Personal protective equipment (PPE)',
    'Emergency response procedures',
    'Required for many industry positions',
    'Nationally recognized certification',
    'Valid for career advancement',
    'Included in Beauty & Career Educator program'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/osha-10.jpg'
)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  summary = EXCLUDED.summary,
  bullets = EXCLUDED.bullets,
  funding = EXCLUDED.funding,
  hero_image = EXCLUDED.hero_image,
  updated_at = now();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added/updated 15 ETPL programs and certifications';
  RAISE NOTICE '📚 Programs include: Business Startup, CPR/Health Safety, HVAC/2Exclusive, DSP, Esthetician, Tax Prep, Public Safety Reentry, Barber Apprenticeship, Beauty & Career Educator, Peer Support, Peer Recovery Coach, CPR, CCHW, Rise Up, OSHA 10';
  RAISE NOTICE '🎓 All programs aligned with WIOA, WRG, JRI, and Apprenticeship funding';
  RAISE NOTICE '🎖️ Credentials: Rise Up (nationally recognized), Career Readiness Certificate, CPR, OSHA 10, CPRS, CPRC, CCHW';
END $$;
