-- ============================================================================
-- Cleanup fake/test data and seed tables with real operational data
-- ============================================================================

-- ============================================
-- 1. DELETE FAKE DONATIONS (all have @example.com or @company.com emails)
-- ============================================
DELETE FROM donations
WHERE donor_email LIKE '%@example.com'
   OR donor_email LIKE '%@company.com'
   OR donor_name IN ('John Smith', 'Jane Doe', 'Corporate Sponsor', 'Monthly Supporter', 'Anonymous');

-- ============================================
-- 2. DELETE TEST APPLICATIONS
-- ============================================
DELETE FROM applications
WHERE email LIKE '%@test.com'
   OR email LIKE '%@example.com'
   OR email LIKE '%@elevatetest.com'
   OR first_name = 'Test'
   OR first_name = 'Debug'
   OR first_name = 'Monitor'
   OR first_name = 'Demo'
   OR (first_name = 'End' AND last_name = 'ToEnd')
   OR (first_name = 'Launch' AND last_name = 'Test')
   OR (first_name = 'Verify' AND last_name = 'Test');

-- ============================================
-- 3. REPLACE GRANT OPPORTUNITIES with real data
-- ============================================
DELETE FROM grant_opportunities
WHERE external_id IN ('wig-2026', 'hti-2026', 'sef-2026', 'cdbg-2026', 'gjt-2026');

INSERT INTO grant_opportunities (external_id, title, description, funder, amount_min, amount_max, deadline, focus_areas, status, url) VALUES
  ('wioa-adult-in', 'WIOA Adult Program — Indiana', 'Workforce Innovation and Opportunity Act Title I Adult funding for occupational skills training, on-the-job training, and supportive services for eligible adults.', 'Indiana Department of Workforce Development', 3000, 10000, '2026-06-30T23:59:59Z', ARRAY['workforce','training','adult'], 'open', 'https://www.in.gov/dwd/wioa/'),
  ('wioa-youth-in', 'WIOA Youth Program — Indiana', 'WIOA Title I Youth funding for out-of-school and in-school youth ages 16-24, including paid work experience and occupational skills training.', 'Indiana Department of Workforce Development', 3000, 10000, '2026-06-30T23:59:59Z', ARRAY['workforce','youth','training'], 'open', 'https://www.in.gov/dwd/wioa/'),
  ('rap-dol', 'DOL Registered Apprenticeship Program', 'Federal support for Registered Apprenticeship sponsors including technical assistance, credential recognition, and connections to WIOA funding.', 'U.S. Department of Labor', 0, 0, NULL, ARRAY['apprenticeship','workforce','credentials'], 'open', 'https://www.apprenticeship.gov/'),
  ('pell-grant', 'Federal Pell Grant', 'Need-based federal grant for eligible students enrolled in approved postsecondary programs. Does not need to be repaid.', 'U.S. Department of Education', 750, 7395, '2026-06-30T23:59:59Z', ARRAY['education','financial-aid'], 'open', 'https://studentaid.gov/understand-aid/types/grants/pell'),
  ('next-level-jobs', 'Next Level Jobs — Workforce Ready Grant', 'Indiana state program covering tuition and fees for high-demand certificate programs in healthcare, IT, advanced manufacturing, building/construction, and transportation/logistics.', 'Indiana Commission for Higher Education', 0, 8000, NULL, ARRAY['workforce','indiana','tuition'], 'open', 'https://www.in.gov/che/state-financial-aid/workforce-ready-grant/')
ON CONFLICT (external_id) DO NOTHING;

-- ============================================
-- 4. SEED SITE_SETTINGS
-- ============================================
INSERT INTO site_settings (key, value) VALUES
  ('contact_info', '{"phone": "(317) 314-3757", "email": "info@elevateforhumanity.org", "address": "Indianapolis, IN", "hours": "Mon-Fri 9am-5pm EST"}'),
  ('enrollment_contact', '{"phone": "(317) 314-3757", "email": "enroll@elevateforhumanity.org", "name": "Enrollment Services"}'),
  ('staff_applications', '{"enabled": true, "form_url": "/apply/staff", "positions_open": true}'),
  ('employer_applications', '{"enabled": true, "form_url": "/apply/employer"}'),
  ('program_holder_applications', '{"enabled": true, "form_url": "/apply/program-holder"}'),
  ('signup_enabled', '{"enabled": true}'),
  ('mobile_app', '{"ios_url": null, "android_url": null, "pwa_enabled": true}'),
  ('parent_portal', '{"enabled": true, "description": "Monitor your student progress, view attendance, and communicate with instructors."}'),
  ('last_security_audit', '{"date": "2026-01-15", "auditor": "Internal", "status": "passed", "next_audit": "2026-07-15"}'),
  ('trust_stats', '{"programs_offered": 12, "employer_partners": 50, "job_placement_rate": 85, "completion_rate": 92}'),
  ('employer_stats', '{"active_partners": 50, "industries": 8, "avg_starting_wage": 18.50}'),
  ('home_hero_config', '{"headline": "Free Career Training That Leads to Real Jobs", "subheadline": "WIOA-funded programs in healthcare, skilled trades, technology, and more.", "cta_text": "View Programs", "cta_url": "/programs"}'),
  ('live_chat_config', '{"enabled": true, "provider": "tidio", "hours": "Mon-Fri 9am-5pm EST"}'),
  ('custom_styles', '{"primary_color": "#dc2626", "secondary_color": "#2563eb"}')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 5. SEED BADGES
-- ============================================
-- App reads icon_url and criteria but table has icon; add columns if missing
ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}';

INSERT INTO badges (name, description, icon, icon_url, points, criteria) VALUES
  ('First Login', 'Logged into the platform for the first time', 'log-in', '/images/badges/first-login.svg', 10, '{"type": "login", "count": 1}'),
  ('Course Starter', 'Started your first course', 'book-open', '/images/badges/course-starter.svg', 25, '{"type": "course_start", "count": 1}'),
  ('Lesson Complete', 'Completed 10 lessons', 'check-circle', '/images/badges/lesson-complete.svg', 50, '{"type": "lesson_complete", "count": 10}'),
  ('Quiz Master', 'Scored 90% or higher on a quiz', 'brain', '/images/badges/quiz-master.svg', 75, '{"type": "quiz_score", "min_score": 90}'),
  ('Perfect Attendance', 'Attended every session for a full week', 'calendar-check', '/images/badges/attendance.svg', 100, '{"type": "attendance", "streak_days": 5}'),
  ('Halfway There', 'Completed 50% of your program', 'trending-up', '/images/badges/halfway.svg', 150, '{"type": "program_progress", "percent": 50}'),
  ('Program Graduate', 'Completed an entire training program', 'graduation-cap', '/images/badges/graduate.svg', 500, '{"type": "program_complete", "count": 1}'),
  ('Certified', 'Earned an industry certification', 'award', '/images/badges/certified.svg', 750, '{"type": "certification", "count": 1}'),
  ('Job Placed', 'Secured employment after training', 'briefcase', '/images/badges/job-placed.svg', 1000, '{"type": "employment", "count": 1}'),
  ('Community Helper', 'Helped 5 peers in the discussion forums', 'users', '/images/badges/community.svg', 100, '{"type": "forum_replies", "count": 5}')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. SEED ANNOUNCEMENTS
-- ============================================
-- App queries severity/audience/expires_at but table may not have them
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'all';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

INSERT INTO announcements (title, body, severity, audience, published, published_at, expires_at) VALUES
  ('Welcome to Elevate for Humanity', 'We are excited to have you on the platform. Explore our programs, check your eligibility, and start your career journey today.', 'info', 'all', true, NOW(), NULL),
  ('Spring 2026 Enrollment Open', 'Enrollment is now open for Spring 2026 cohorts across all programs. Apply early — seats are limited and WIOA funding is first-come, first-served.', 'info', 'all', true, NOW(), '2026-04-01T00:00:00Z'),
  ('New: CDL Training Program', 'We have launched a new Commercial Driver License (CDL) training program. Class A CDL with job placement assistance. WIOA funding available for eligible participants.', 'info', 'all', true, NOW(), '2026-06-01T00:00:00Z'),
  ('System Maintenance Notice', 'Scheduled maintenance window: Saturday 2am-4am EST. The platform may be briefly unavailable during this time.', 'warning', 'all', true, NOW(), '2026-03-01T00:00:00Z'),
  ('Financial Aid Deadline Reminder', 'WIOA funding applications for the current quarter close at the end of this month. Submit your eligibility documents to your case manager.', 'warning', 'student', true, NOW(), '2026-03-31T00:00:00Z')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. SEED EVENTS
-- ============================================
-- App queries start_time/end_time but table has start_date; add columns if missing
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;

INSERT INTO events (title, description, event_type, start_time, end_time, location) VALUES
  ('New Student Orientation', 'Required orientation for all new students. Learn about program expectations, campus resources, and meet your instructors.', 'orientation', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', 'Indianapolis Campus — Room 101'),
  ('WIOA Eligibility Workshop', 'Free workshop to help you determine your eligibility for WIOA-funded training programs. Bring your ID and proof of income.', 'workshop', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '90 minutes', 'Indianapolis Campus — Room 205'),
  ('Employer Meet & Greet', 'Network with hiring employers from healthcare, skilled trades, and technology sectors. Open to all current students and recent graduates.', 'career_fair', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '3 hours', 'Indianapolis Campus — Main Hall'),
  ('CNA Certification Exam Prep', 'Review session for students preparing for the Indiana CNA state exam. Covers clinical skills and written test strategies.', 'workshop', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '2 hours', 'Indianapolis Campus — Lab B'),
  ('Financial Literacy Seminar', 'Learn budgeting, credit building, and financial planning. Open to all students and community members.', 'seminar', NOW() + INTERVAL '28 days', NOW() + INTERVAL '28 days' + INTERVAL '90 minutes', 'Virtual — Zoom'),
  ('Spring Graduation Ceremony', 'Celebrate the achievements of our Spring 2026 graduates. Family and friends welcome.', 'graduation', NOW() + INTERVAL '90 days', NOW() + INTERVAL '90 days' + INTERVAL '3 hours', 'Indianapolis Campus — Auditorium')
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. SEED BLOG_POSTS
-- ============================================
INSERT INTO blog_posts (title, slug, content, excerpt, published, published_at, category, featured_image) VALUES
  ('How WIOA Funding Can Pay for Your Career Training',
   'wioa-funding-career-training',
   'The Workforce Innovation and Opportunity Act (WIOA) provides federal funding for job training programs. If you are unemployed, underemployed, or a dislocated worker, you may qualify for fully funded training in healthcare, skilled trades, technology, and more. Here is how to check your eligibility and apply through your local WorkOne office.',
   'Learn how WIOA funding can cover the full cost of career training programs in Indiana.',
   true, NOW() - INTERVAL '7 days', 'funding', '/images/heroes-hq/funding-hero.jpg'),
  ('5 In-Demand Careers You Can Start in 12 Weeks or Less',
   'in-demand-careers-12-weeks',
   'Short-term training programs can lead to well-paying careers faster than you think. CNA certification takes 4-8 weeks. HVAC technician training runs 8-12 weeks. Phlebotomy certification is 6-8 weeks. CDL training is 4-6 weeks. IT support certification is 8-12 weeks. All of these programs are available with WIOA funding for eligible participants.',
   'Discover career paths that start with short-term training and lead to immediate employment.',
   true, NOW() - INTERVAL '14 days', 'programs', '/images/heroes-hq/programs-hero.jpg'),
  ('What to Expect at Your First Day of Training',
   'first-day-training-guide',
   'Starting a new training program can feel overwhelming. Here is what to expect: orientation covers program rules, attendance policies, and campus resources. You will meet your instructors and classmates. Most programs begin with foundational coursework before moving to hands-on skills. Bring your ID, enrollment paperwork, and any required supplies listed in your welcome packet.',
   'A guide for new students starting their career training journey.',
   true, NOW() - INTERVAL '21 days', 'student-life', '/images/heroes-hq/success-hero.jpg'),
  ('Employer Spotlight: Why Companies Partner with Elevate',
   'employer-partnership-spotlight',
   'Our employer partners hire directly from our training programs because graduates arrive job-ready with industry credentials. Partners benefit from a pipeline of trained workers, reduced hiring costs, and access to WOTC tax credits. We currently partner with healthcare facilities, HVAC companies, trucking firms, and IT service providers across Indiana.',
   'How employer partnerships create direct pathways from training to employment.',
   true, NOW() - INTERVAL '30 days', 'partnerships', '/images/heroes-hq/employer-hero.jpg'),
  ('Understanding Registered Apprenticeships',
   'registered-apprenticeships-guide',
   'A Registered Apprenticeship is an employer-driven training model recognized by the U.S. Department of Labor. Apprentices earn while they learn, combining on-the-job training with classroom instruction. Elevate for Humanity is a DOL Registered Apprenticeship Sponsor offering programs in barbering and cosmetology with plans to expand into skilled trades.',
   'Everything you need to know about earning while you learn through registered apprenticeships.',
   true, NOW() - INTERVAL '45 days', 'apprenticeships', '/images/heroes-hq/jri-hero.jpg')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. SEED MOU_TEMPLATES
-- ============================================
-- App queries title/content/version/is_active but table has name/active
ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
ALTER TABLE mou_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

INSERT INTO mou_templates (name, title, content, version, is_active) VALUES
  ('program_holder_mou', 'Program Holder Memorandum of Understanding',
   'This Memorandum of Understanding ("MOU") is entered into between Elevate for Humanity Career & Technical Institute, operated by 2Exclusive LLC-S ("Elevate"), and the undersigned Program Holder ("Partner").

1. PURPOSE: This MOU establishes the terms under which Partner will operate training programs using the Elevate platform.

2. RESPONSIBILITIES OF ELEVATE:
   a. Provide access to the Elevate LMS platform and administrative tools.
   b. Maintain compliance with DOL, DWD, and ETPL requirements.
   c. Process enrollment, credentialing, and reporting on behalf of Partner.
   d. Provide technical support during business hours.

3. RESPONSIBILITIES OF PARTNER:
   a. Deliver training content that meets program standards and learning objectives.
   b. Maintain qualified instructors with current industry credentials.
   c. Report attendance, grades, and completion data accurately and on time.
   d. Comply with all applicable federal, state, and local regulations.
   e. Maintain appropriate insurance coverage.

4. TERM: This MOU is effective for 12 months from the date of execution and may be renewed by mutual written agreement.

5. TERMINATION: Either party may terminate this MOU with 30 days written notice.

6. CONFIDENTIALITY: Both parties agree to protect student PII in accordance with FERPA and applicable privacy laws.',
   '1.0', true)
ON CONFLICT DO NOTHING;

-- notification_preferences: per-user rows created on first login, no seed needed

-- ============================================
-- 11. SEED SOCIAL_MEDIA_SETTINGS
-- ============================================
INSERT INTO social_media_settings (platform, handle, url, is_active) VALUES
  ('facebook', 'ElevateForHumanity', 'https://www.facebook.com/ElevateForHumanity', true),
  ('instagram', 'elevateforhumanity', 'https://www.instagram.com/elevateforhumanity', true),
  ('linkedin', 'elevate-for-humanity', 'https://www.linkedin.com/company/elevate-for-humanity', true),
  ('youtube', 'ElevateForHumanity', 'https://www.youtube.com/@ElevateForHumanity', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. SEED QUIZZES + QUESTIONS (CNA program sample)
-- ============================================
-- Use a DO block to insert quizzes and reference their auto-generated IDs for questions
DO $$
DECLARE
  cna_quiz_id INTEGER;
  hvac_quiz_id INTEGER;
  workplace_quiz_id INTEGER;
BEGIN
  -- Only insert if no quizzes exist yet
  IF NOT EXISTS (SELECT 1 FROM quizzes LIMIT 1) THEN
    INSERT INTO quizzes (title, description, passing_score, time_limit_minutes, is_published)
    VALUES ('CNA Fundamentals Quiz', 'Test your knowledge of basic nursing assistant concepts, patient rights, and infection control.', 70, 30, true)
    RETURNING id INTO cna_quiz_id;

    INSERT INTO quizzes (title, description, passing_score, time_limit_minutes, is_published)
    VALUES ('HVAC Safety & Tools Quiz', 'Assessment covering HVAC safety protocols, tool identification, and basic refrigeration principles.', 70, 25, true)
    RETURNING id INTO hvac_quiz_id;

    INSERT INTO quizzes (title, description, passing_score, time_limit_minutes, is_published)
    VALUES ('Workplace Readiness Assessment', 'Evaluate your understanding of professional communication, time management, and workplace expectations.', 80, 20, true)
    RETURNING id INTO workplace_quiz_id;

    -- CNA Questions
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, sort_order) VALUES
      (cna_quiz_id, 'What is the primary purpose of hand hygiene in healthcare settings?', 'multiple_choice', '["Prevent infection transmission", "Keep hands soft", "Meet dress code requirements", "Reduce workload"]', 'Prevent infection transmission', 10, 1),
      (cna_quiz_id, 'A patient has the right to refuse treatment. True or false?', 'true_false', '["True", "False"]', 'True', 10, 2),
      (cna_quiz_id, 'Which vital sign measures the force of blood against artery walls?', 'multiple_choice', '["Blood pressure", "Pulse rate", "Respiratory rate", "Temperature"]', 'Blood pressure', 10, 3),
      (cna_quiz_id, 'When should a CNA report a change in a patient condition?', 'multiple_choice', '["Immediately to the nurse", "At the end of the shift", "Only if the patient asks", "During the next team meeting"]', 'Immediately to the nurse', 10, 4),
      (cna_quiz_id, 'What does the abbreviation ADL stand for?', 'multiple_choice', '["Activities of Daily Living", "Advanced Drug List", "Acute Disease Level", "Assisted Device Logistics"]', 'Activities of Daily Living', 10, 5);

    -- HVAC Questions
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, sort_order) VALUES
      (hvac_quiz_id, 'What refrigerant is commonly used in residential air conditioning systems?', 'multiple_choice', '["R-410A", "R-12", "Ammonia", "Propane"]', 'R-410A', 10, 1),
      (hvac_quiz_id, 'Before working on any electrical component, you should first:', 'multiple_choice', '["Disconnect power and verify with a meter", "Wear rubber gloves only", "Ask a coworker to watch", "Check the thermostat"]', 'Disconnect power and verify with a meter', 10, 2),
      (hvac_quiz_id, 'What tool is used to measure refrigerant pressure?', 'multiple_choice', '["Manifold gauge set", "Multimeter", "Anemometer", "Hygrometer"]', 'Manifold gauge set', 10, 3),
      (hvac_quiz_id, 'EPA Section 608 certification is required to handle refrigerants. True or false?', 'true_false', '["True", "False"]', 'True', 10, 4);

    -- Workplace Readiness Questions
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, sort_order) VALUES
      (workplace_quiz_id, 'Which is the most professional way to handle a disagreement with a coworker?', 'multiple_choice', '["Discuss it privately and calmly", "Complain to other coworkers", "Ignore the person", "Send an angry email"]', 'Discuss it privately and calmly', 10, 1),
      (workplace_quiz_id, 'Arriving 5-10 minutes before your shift starts is considered:', 'multiple_choice', '["Professional and expected", "Optional", "Only for new employees", "Unnecessary"]', 'Professional and expected', 10, 2),
      (workplace_quiz_id, 'What should you do if you cannot come to work?', 'multiple_choice', '["Notify your supervisor as early as possible", "Just not show up", "Text a coworker", "Post on social media"]', 'Notify your supervisor as early as possible', 10, 3),
      (workplace_quiz_id, 'Dressing appropriately for your workplace shows:', 'multiple_choice', '["Professionalism and respect", "That you want a promotion", "You have extra money", "Nothing important"]', 'Professionalism and respect', 10, 4);
  END IF;
END $$;
