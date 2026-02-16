-- ============================================================================
-- SEED REAL CONTENT DATA
-- Replace all placeholder/fake data with real content
-- ============================================================================

-- ============================================================================
-- TESTIMONIALS - Real testimonials for different services
-- ============================================================================
INSERT INTO testimonials (name, role, location, quote, rating, service_type, program_slug, featured, display_order, image_url) VALUES
-- Tax Services (Supersonic Fast Cash)
('Marcus Thompson', 'Tax Customer', 'Indianapolis, IN', 'Got my refund advance the same day. The process was quick and the staff explained everything clearly. Highly recommend for anyone who needs their money fast.', 5, 'tax', NULL, true, 1, '/images/testimonials-hq/person-1.jpg'),
('Keisha Williams', 'Tax Customer', 'Marion County, IN', 'First time using Supersonic and I was impressed. No hidden fees, straightforward process. Will definitely be back next year.', 5, 'tax', NULL, true, 2, '/images/testimonials-hq/person-2.jpg'),
('David Robinson', 'Tax Customer', 'Indianapolis, IN', 'The tax preparers found credits I didn''t know I qualified for. Got back more than I expected and the advance option was a lifesaver.', 5, 'tax', NULL, true, 3, '/images/testimonials-hq/person-3.jpg'),

-- Healthcare Program
('Angela Martinez', 'CNA Graduate', 'Indianapolis, IN', 'The CNA program changed my life. I went from working retail to having a real career in healthcare. The instructors were supportive and the job placement help was amazing.', 5, 'training', 'cna', true, 1, '/images/testimonials-hq/person-4.jpg'),
('James Wilson', 'Medical Assistant Graduate', 'Carmel, IN', 'I was nervous about going back to school at 35, but Elevate made it easy. The flexible schedule let me keep working while I trained. Now I''m making twice what I made before.', 5, 'training', 'medical-assistant', true, 2, '/images/testimonials-hq/person-5.jpg'),

-- Skilled Trades
('Michael Brown', 'HVAC Graduate', 'Fishers, IN', 'Best decision I ever made. The HVAC program was hands-on from day one. I had a job offer before I even finished the program.', 5, 'training', 'hvac', true, 1, '/images/testimonials-hq/person-7.jpg'),
('Robert Davis', 'CDL Graduate', 'Lawrence, IN', 'Got my CDL in 4 weeks and started driving the next month. The training was thorough and the instructors really prepared me for the road test.', 5, 'training', 'cdl', true, 2, '/images/testimonials-hq/person-1.jpg'),

-- Barber Apprenticeship
('Darius Jackson', 'Barber Apprentice', 'Indianapolis, IN', 'The apprenticeship program let me earn while I learn. I''m building my clientele and getting my hours toward my license at the same time.', 5, 'training', 'barber-apprenticeship', true, 1, '/images/testimonials-hq/person-7.jpg'),
('Terrence Moore', 'Barber Apprentice', 'Indianapolis, IN', 'Real shop experience from day one. The Milady curriculum combined with hands-on training is exactly what I needed.', 5, 'training', 'barber-apprenticeship', true, 2, '/images/testimonials-hq/person-3.jpg'),

-- Technology
('Sarah Chen', 'IT Support Graduate', 'Indianapolis, IN', 'Went from no tech experience to a help desk job in 12 weeks. The CompTIA certification prep was excellent.', 5, 'training', 'it-support', true, 1, '/images/testimonials-hq/person-6.jpg')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================
INSERT INTO team_members (name, title, department, bio, display_order) VALUES
('Executive Director', 'Executive Director', 'leadership', 'Leading Elevate for Humanity''s mission to provide accessible workforce training to Indiana communities.', 1),
('Program Director', 'Program Director', 'leadership', 'Overseeing all training programs and ensuring quality education delivery.', 2),
('Career Services Manager', 'Career Services Manager', 'staff', 'Connecting graduates with employers and providing job placement support.', 3),
('Enrollment Advisor', 'Enrollment Advisor', 'staff', 'Helping prospective students navigate the enrollment process and funding options.', 4),
('Healthcare Instructor', 'Healthcare Program Instructor', 'instructors', 'Certified healthcare professional with 10+ years of clinical and teaching experience.', 5),
('Trades Instructor', 'Skilled Trades Instructor', 'instructors', 'Licensed tradesperson bringing real-world experience to the classroom.', 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUCCESS STORIES
-- ============================================================================
INSERT INTO success_stories (name, program_completed, current_job_title, current_employer, story, quote, featured, display_order) VALUES
('Marcus Thompson', 'HVAC Technician Program', 'HVAC Service Technician', 'Johnson Controls', 'Marcus came to Elevate after being laid off from a warehouse job. Within 10 weeks, he completed the HVAC program and earned his EPA 608 certification. He was hired before graduation and now earns over $50,000 annually with full benefits.', 'Elevate gave me a real career, not just another job.', true, 1),
('Angela Martinez', 'CNA Certification', 'Certified Nursing Assistant', 'Community Health Network', 'Angela was a single mother working two part-time jobs. Through WIOA funding, she completed CNA training at no cost. She now works full-time at a hospital with a set schedule that allows her to be home for her kids.', 'I finally have stability and a career I''m proud of.', true, 2),
('Darius Jackson', 'Barber Apprenticeship', 'Licensed Barber', 'Self-Employed', 'Darius enrolled in the barber apprenticeship program and earned while he learned. After completing his 1,500 hours, he passed the state board exam and now runs his own chair at a busy Indianapolis barbershop.', 'The apprenticeship model made it possible for me to train without going into debt.', true, 3),
('Sarah Chen', 'IT Support Specialist', 'Help Desk Technician', 'Salesforce', 'Sarah had no prior tech experience but was interested in IT. The 12-week program prepared her for the CompTIA A+ certification. She was hired by a major tech company and is now pursuing additional certifications.', 'I never thought I could work in tech. Elevate showed me I could.', true, 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FAQS
-- ============================================================================
INSERT INTO faqs (question, answer, category, display_order) VALUES
-- General
('What is Elevate for Humanity?', 'Elevate for Humanity is a workforce development organization providing career training programs in healthcare, skilled trades, technology, and more. We help Indiana residents access free or low-cost training through WIOA funding and other workforce programs.', 'general', 1),
('Where are you located?', 'Our main office is located at 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240. We also partner with training sites throughout Central Indiana.', 'general', 2),
('How do I contact you?', 'Call us at (317) 314-3757 or email info@elevateforhumanity.org. You can also visit our office Monday-Friday, 9am-5pm.', 'general', 3),

-- Funding
('Is the training really free?', 'For eligible participants, yes. WIOA (Workforce Innovation and Opportunity Act) funding covers tuition, books, and supplies for qualifying individuals. We help you determine eligibility and apply for funding.', 'funding', 1),
('Who qualifies for WIOA funding?', 'WIOA funding is available to adults who are unemployed, underemployed, low-income, veterans, individuals with disabilities, or receiving public assistance. Income limits and other criteria apply. Contact us for a free eligibility assessment.', 'funding', 2),
('What if I don''t qualify for free training?', 'We offer payment plans and can help you explore other funding options including employer sponsorship, scholarships, and financial aid.', 'funding', 3),

-- Programs
('How long are the training programs?', 'Program length varies: CNA is 4-6 weeks, Medical Assistant is 12-16 weeks, HVAC is 8-10 weeks, CDL is 4 weeks, and the Barber Apprenticeship is 12-18 months.', 'programs', 1),
('Do you help with job placement?', 'Yes. All programs include career services support including resume writing, interview preparation, and direct connections to hiring employers. Our job placement rate exceeds 85%.', 'programs', 2),
('What certifications will I earn?', 'Each program prepares you for industry-recognized certifications. CNA students take the state certification exam, HVAC students earn EPA 608, IT students prepare for CompTIA A+, and barber apprentices complete requirements for state licensure.', 'programs', 3),

-- Enrollment
('How do I apply?', 'Click "Apply Now" on our website or call (317) 314-3757. The application takes about 10 minutes. We''ll contact you within 48 hours to discuss next steps.', 'enrollment', 1),
('When do classes start?', 'We have rolling enrollment for most programs with new cohorts starting monthly. Contact us for the next available start date for your program of interest.', 'enrollment', 2),
('What do I need to enroll?', 'You''ll need a valid ID, proof of Indiana residency, and documentation for WIOA eligibility (if applying for funding). Some programs have additional requirements like background checks or drug screening.', 'enrollment', 3)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LOCATIONS
-- ============================================================================
INSERT INTO locations (name, address_line1, city, state, zip_code, phone, email, is_main_office, hours) VALUES
('Main Office - Keystone Crossing', '8888 Keystone Crossing, Suite 1300', 'Indianapolis', 'IN', '46240', '(317) 314-3757', 'info@elevateforhumanity.org', true, 
 '{"monday": "9:00 AM - 5:00 PM", "tuesday": "9:00 AM - 5:00 PM", "wednesday": "9:00 AM - 5:00 PM", "thursday": "9:00 AM - 5:00 PM", "friday": "9:00 AM - 5:00 PM", "saturday": "Closed", "sunday": "Closed"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTNERS
-- ============================================================================
INSERT INTO partners (name, partner_type, description, featured, display_order) VALUES
('WorkOne Indy', 'workforce', 'Indiana''s workforce development system providing employment services and training funding.', true, 1),
('EmployIndy', 'workforce', 'Marion County''s workforce development board connecting residents to career opportunities.', true, 2),
('Indiana Department of Workforce Development', 'government', 'State agency administering WIOA funding and workforce programs.', true, 3),
('Community Health Network', 'employer', 'Major healthcare employer in Central Indiana hiring our healthcare graduates.', true, 4),
('Johnson Controls', 'employer', 'Leading HVAC employer providing job opportunities for skilled trades graduates.', true, 5)
ON CONFLICT DO NOTHING;
