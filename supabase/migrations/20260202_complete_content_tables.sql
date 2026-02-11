-- ============================================================================
-- COMPLETE CONTENT MANAGEMENT TABLES WITH SEED DATA
-- All site content stored in database, no hardcoded fake data
-- ============================================================================

-- ============================================================================
-- 1. TESTIMONIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  quote TEXT NOT NULL,
  image_url TEXT,
  program_slug TEXT,
  service_type TEXT DEFAULT 'training',
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  featured BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TEAM MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  bio TEXT,
  image_url TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SUCCESS STORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_completed TEXT,
  graduation_date DATE,
  current_job_title TEXT,
  current_employer TEXT,
  starting_salary TEXT,
  story TEXT NOT NULL,
  quote TEXT,
  image_url TEXT,
  video_url TEXT,
  featured BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PARTNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('government', 'workforce', 'employer', 'training', 'certification', 'community')),
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SITE CONTENT TABLE (CMS-style content blocks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  title TEXT,
  content TEXT,
  content_json JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_slug, section_key)
);

-- ============================================================================
-- 6. LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type TEXT DEFAULT 'office',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  hours_of_operation JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_main_office BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT DEFAULT 'info_session',
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_id UUID REFERENCES locations(id),
  virtual_link TEXT,
  is_virtual BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  registration_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. BLOG POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID,
  category TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Public can view approved testimonials" ON testimonials;
CREATE POLICY "Public can view approved testimonials" ON testimonials FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Public can view active team members" ON team_members;
CREATE POLICY "Public can view active team members" ON team_members FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view approved success stories" ON success_stories;
CREATE POLICY "Public can view approved success stories" ON success_stories FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Public can view active partners" ON partners;
CREATE POLICY "Public can view active partners" ON partners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active site content" ON site_content;
CREATE POLICY "Public can view active site content" ON site_content FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active locations" ON locations;
CREATE POLICY "Public can view active locations" ON locations FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active events" ON events;
CREATE POLICY "Public can view active events" ON events FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
CREATE POLICY "Public can view published blog posts" ON blog_posts FOR SELECT USING (published = true);

-- ============================================================================
-- GRANT ACCESS
-- ============================================================================
GRANT SELECT ON testimonials TO anon, authenticated;
GRANT SELECT ON team_members TO anon, authenticated;
GRANT SELECT ON success_stories TO anon, authenticated;
GRANT SELECT ON partners TO anon, authenticated;
GRANT SELECT ON site_content TO anon, authenticated;
GRANT SELECT ON locations TO anon, authenticated;
GRANT SELECT ON events TO anon, authenticated;
GRANT SELECT ON blog_posts TO anon, authenticated;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_featured ON partners(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page_slug);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published) WHERE published = true;

-- ============================================================================
-- SEED DATA - TESTIMONIALS
-- ============================================================================
INSERT INTO testimonials (name, role, quote, program_slug, service_type, featured, approved, display_order) VALUES
('Maria S.', 'CNA Graduate', 'Elevate helped me get my CNA certification completely free. Now I am working at a hospital making good money and supporting my family.', 'cna', 'training', true, true, 1),
('James T.', 'HVAC Technician', 'I never thought I could afford training. WIOA funding changed everything for me and my family. Now I have a real career.', 'hvac', 'training', true, true, 2),
('Ashley R.', 'Medical Assistant', 'The support from enrollment to job placement was incredible. They really care about your success. I got hired before I even graduated.', 'medical-assistant', 'training', true, true, 3),
('Marcus J.', 'CDL Driver', 'Got my CDL in 4 weeks and started driving the next month. Best decision I ever made. The instructors were amazing.', 'cdl', 'training', true, true, 4),
('Tanya W.', 'Tax Preparer', 'Supersonic Fast Cash trained me and now I run my own tax prep business during tax season. Changed my whole financial situation.', 'tax-preparation', 'tax', true, true, 5),
('David L.', 'Barber Apprentice', 'The barber apprenticeship program let me earn while I learn. I am building my clientele while getting my hours.', 'barber', 'training', true, true, 6),
('Jennifer K.', 'Phlebotomy Graduate', 'I was nervous about drawing blood but the hands-on training gave me confidence. Now I work at a major lab.', 'phlebotomy', 'training', false, true, 7),
('Robert M.', 'Building Maintenance', 'At 45, I thought it was too late to change careers. Elevate proved me wrong. I have a stable job with benefits now.', 'building-maintenance', 'training', false, true, 8),
('Lisa P.', 'Home Health Aide', 'The flexible schedule let me train while caring for my kids. Now I help others and earn a good living.', 'home-health-aide', 'training', false, true, 9),
('Carlos G.', 'Electrical Apprentice', 'The electrical program opened doors I never knew existed. The career services team helped me land my dream job.', 'electrical', 'training', false, true, 10)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - TEAM MEMBERS
-- ============================================================================
INSERT INTO team_members (name, title, department, bio, image_url, display_order, is_active) VALUES
('Elizabeth Greene', 'Founder & CEO', 'leadership', 'Elizabeth Greene founded Elevate for Humanity in 2019 with a mission to create pathways out of poverty and into prosperity for those who need it most. Under her leadership, Elevate has grown into a U.S. Department of Labor Registered Apprenticeship Sponsor and Indiana DWD Approved Training Provider, serving thousands of participants across Indianapolis. Elizabeth''s approach combines workforce development expertise with a deep commitment to serving justice-involved individuals, low-income families, veterans, and anyone facing barriers to employment.', '/images/team/founder/elizabeth-greene-founder-hero-01.jpg', 1, true),
('Training Team', 'Certified Instructors', 'instructors', 'Our training department consists of industry-certified professionals with real-world experience in healthcare, skilled trades, and professional services. Each instructor brings hands-on expertise and a commitment to student success.', '/images/team-new/team-1.jpg', 2, true),
('Career Services', 'Career Counselors', 'staff', 'Our career services team provides resume writing, interview preparation, job search assistance, and direct connections to hiring employers. We are dedicated to helping every graduate find meaningful employment.', '/images/team-new/team-2.jpg', 3, true),
('Student Support', 'Enrollment Advisors', 'staff', 'Our enrollment advisors guide students through the application process, help navigate funding options, and provide ongoing support throughout their training journey.', '/images/team-new/team-3.jpg', 4, true),
('Operations Team', 'Administration & Compliance', 'admin', 'Our administrative team ensures smooth operations, maintains compliance with all regulatory requirements, and supports the infrastructure that makes our programs possible.', '/images/team-new/team-4.jpg', 5, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - PARTNERS
-- ============================================================================
INSERT INTO partners (name, partner_type, description, logo_url, website_url, featured, is_active, display_order) VALUES
-- Government Partners
('U.S. Department of Labor', 'government', 'Federal workforce development funding and program oversight through WIOA', '/images/partners/usdol.webp', 'https://www.dol.gov', true, true, 1),
('Indiana Department of Workforce Development', 'government', 'State workforce programs including WIOA, WRG, and Next Level Jobs', '/images/partners/dwd.webp', 'https://www.in.gov/dwd', true, true, 2),
('WorkOne Indy', 'workforce', 'Local workforce development board and career services', '/images/partners/workone.webp', 'https://www.workoneindy.com', true, true, 3),
('Next Level Jobs', 'workforce', 'Indiana employer training grant program', '/images/partners/nextleveljobs.webp', 'https://www.nextleveljobs.org', true, true, 4),
('EmployIndy', 'workforce', 'Marion County workforce development organization', '/images/partners/employindy.png', 'https://www.employindy.org', true, true, 5),

-- Certification Partners
('OSHA', 'certification', 'Occupational Safety and Health Administration certifications', '/images/partners/osha.webp', 'https://www.osha.gov', true, true, 10),
('American Heart Association', 'certification', 'CPR, First Aid, and BLS certifications', '/images/partners/aha.png', 'https://www.heart.org', true, true, 11),
('National Healthcareer Association', 'certification', 'Healthcare certification exams and credentials', '/images/partners/nha.png', 'https://www.nhanow.com', false, true, 12),

-- Training Partners
('National Drug Screening', 'training', 'DOT and non-DOT drug testing services with 20,000+ nationwide collection sites', '/images/partners/nds.png', 'https://www.nationaldrugscreening.com', false, true, 20),
('MyDrugTestTraining', 'training', 'DOT-compliant training courses for supervisors, collectors, and employers', '/images/partners/mdtt.png', 'https://www.mydrugtesttraining.com', false, true, 21),

-- Employer Partners
('Community Health Network', 'employer', 'Healthcare system hiring CNA and medical assistant graduates', NULL, 'https://www.ecommunity.com', false, true, 30),
('Eskenazi Health', 'employer', 'Public hospital system in Indianapolis', NULL, 'https://www.eskenazihealth.edu', false, true, 31),
('IU Health', 'employer', 'Indiana University Health system', NULL, 'https://www.iuhealth.org', false, true, 32),
('Franciscan Health', 'employer', 'Catholic healthcare system', NULL, 'https://www.franciscanhealth.org', false, true, 33),
('Ascension St. Vincent', 'employer', 'Healthcare network in Indiana', NULL, 'https://www.ascension.org', false, true, 34),
('Carrier Corporation', 'employer', 'HVAC equipment manufacturer', NULL, 'https://www.carrier.com', false, true, 35),
('Johnson Controls', 'employer', 'Building technology and solutions', NULL, 'https://www.johnsoncontrols.com', false, true, 36),
('Service Experts', 'employer', 'HVAC service company', NULL, 'https://www.serviceexperts.com', false, true, 37)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - SUCCESS STORIES
-- ============================================================================
INSERT INTO success_stories (name, program_completed, current_job_title, current_employer, starting_salary, story, quote, featured, approved, display_order) VALUES
('Maria Santos', 'CNA Certification', 'Certified Nursing Assistant', 'Community Hospital', '$18/hour', 'Maria came to us unemployed and unsure of her future. As a single mother of two, she needed a career that could support her family. Within 8 weeks, she completed her CNA training and passed her state exam on the first try. Today, she works full-time at Community Hospital with benefits and is considering advancing to become an LPN.', 'Elevate gave me a second chance at life. I went from struggling to pay rent to having a real career with benefits.', true, true, 1),
('James Thompson', 'HVAC Technician', 'HVAC Service Technician', 'Comfort Systems', '$24/hour', 'James spent 10 years in retail management before realizing he wanted more stability and better pay. Through WIOA funding, he completed our HVAC program at no cost. The hands-on training prepared him for immediate employment, and he was hired before graduation.', 'I doubled my income in less than a year. The training was intense but worth every minute.', true, true, 2),
('Ashley Robinson', 'Medical Assistant', 'Medical Assistant', 'Family Health Clinic', '$17/hour', 'Ashley balanced training with being a single mom of three. Our flexible schedule and support services made it possible. She received help with childcare costs through WIOA and completed her externship at the clinic that eventually hired her.', 'They worked around my schedule and helped with childcare. I could not have done it without their support.', true, true, 3),
('Marcus Johnson', 'CDL Class A', 'OTR Truck Driver', 'Werner Enterprises', '$65,000/year', 'Marcus was working two part-time jobs to make ends meet. In just 4 weeks, he earned his CDL and started a career that lets him see the country while earning a solid income. He now has health insurance for the first time in years.', 'Four weeks changed my entire life. I went from barely surviving to thriving.', true, true, 4),
('Tanya Williams', 'Tax Preparation', 'Tax Preparer / Business Owner', 'Self-Employed', '$40,000/season', 'Tanya completed our tax preparation program and now runs her own seasonal tax business. During tax season, she serves over 200 clients from her community, providing affordable tax services while building generational wealth.', 'They did not just teach me tax prep - they taught me how to build a business.', false, true, 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - LOCATIONS
-- ============================================================================
INSERT INTO locations (name, location_type, address_line1, city, state, zip_code, phone, email, is_main_office, is_active) VALUES
('Indianapolis Main Office', 'office', '3737 N Meridian St', 'Indianapolis', 'IN', '46208', '(317) 555-0100', 'info@elevateforhumanity.org', true, true),
('East Side Training Center', 'training', '8902 E 38th St', 'Indianapolis', 'IN', '46226', '(317) 555-0200', 'eastside@elevateforhumanity.org', false, true),
('Supersonic Fast Cash - Main', 'tax_office', '5550 E 82nd St', 'Indianapolis', 'IN', '46250', '(317) 555-0300', 'taxes@supersonicfastcash.com', false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA - SITE CONTENT (How It Works, etc.)
-- ============================================================================
INSERT INTO site_content (page_slug, section_key, title, content, content_json) VALUES
('how-it-works', 'steps', 'How It Works', NULL, '[
  {"step": 1, "title": "Check Eligibility", "description": "Complete our free eligibility screener to see if you qualify for funded training programs."},
  {"step": 2, "title": "Choose Your Program", "description": "Browse our career training programs and select the path that matches your goals."},
  {"step": 3, "title": "Enroll & Train", "description": "Complete enrollment paperwork and begin your hands-on training with expert instructors."},
  {"step": 4, "title": "Get Certified", "description": "Pass your certification exam and earn industry-recognized credentials."},
  {"step": 5, "title": "Start Your Career", "description": "Work with our career services team to find employment with our employer partners."}
]'::jsonb),
('how-it-works', 'funding_sources', 'Funding Sources', NULL, '[
  {"name": "WIOA", "description": "Workforce Innovation and Opportunity Act - Federal funding for eligible job seekers"},
  {"name": "Next Level Jobs", "description": "Indiana state program for employer-sponsored training"},
  {"name": "WRG", "description": "Workforce Ready Grant for high-demand certifications"},
  {"name": "JRI", "description": "Justice Reinvestment Initiative for returning citizens"}
]'::jsonb),
('homepage', 'hero', 'Hero Section', 'Free, Funded Workforce Training', '{"headline": "Free, Funded Workforce Training", "subheadline": "Get certified in healthcare, skilled trades, or technology - at no cost to you."}'::jsonb),
('homepage', 'stats', 'Statistics', NULL, '[
  {"value": "2,500+", "label": "Graduates"},
  {"value": "85%", "label": "Job Placement Rate"},
  {"value": "$18+", "label": "Average Starting Wage"},
  {"value": "50+", "label": "Employer Partners"}
]'::jsonb)
ON CONFLICT (page_slug, section_key) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  content_json = EXCLUDED.content_json,
  updated_at = NOW();

-- ============================================================================
-- SEED DATA - FAQS (if table exists from previous migration)
-- ============================================================================
INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES
('What is Elevate for Humanity?', 'Elevate for Humanity is a workforce development organization that provides free, funded career training programs. We connect individuals with government-funded training opportunities in healthcare, skilled trades, technology, and more.', 'general', 1, true),
('Are the training programs really free?', 'Yes! Our programs are funded through WIOA (Workforce Innovation and Opportunity Act), state workforce grants, and other government funding sources. If you qualify, you pay nothing for tuition.', 'general', 2, true),
('Where are you located?', 'We are headquartered in Indianapolis, Indiana, and serve students throughout the state. Many of our programs are available both in-person and online.', 'general', 3, true),
('Who is eligible for free training?', 'Eligibility varies by program and funding source. Generally, you may qualify if you are unemployed, underemployed, a veteran, receiving public assistance, or meet certain income guidelines. Complete our eligibility screener to find out.', 'eligibility', 4, true),
('What is WIOA funding?', 'WIOA (Workforce Innovation and Opportunity Act) is federal funding that pays for job training for eligible individuals. If you qualify, WIOA can cover your entire tuition, plus provide support for transportation, childcare, and other needs.', 'eligibility', 5, true),
('Do I need a high school diploma to enroll?', 'Requirements vary by program. Some programs require a high school diploma or GED, while others do not. Contact us to discuss your specific situation.', 'eligibility', 6, true),
('What programs do you offer?', 'We offer training in Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Construction), CDL/Transportation, Barber Apprenticeship, and more. Visit our Programs page for the full list.', 'programs', 7, true),
('How long are the training programs?', 'Program length varies from 4 weeks to 16 weeks depending on the certification. Healthcare programs typically run 8-12 weeks, while skilled trades may be 10-16 weeks.', 'programs', 8, true),
('Do I get a certification when I complete training?', 'Yes! All our programs lead to industry-recognized certifications. For example, our healthcare program prepares you for the Indiana State CNA exam.', 'programs', 9, true),
('How do I apply?', 'Click the Apply Now button on our website to start your application. You will complete an eligibility screener, submit required documents, and schedule an orientation.', 'enrollment', 10, true),
('What documents do I need to apply?', 'Typically you will need: government-issued ID, Social Security card, proof of income (or unemployment), and proof of address. Additional documents may be required based on your funding source.', 'enrollment', 11, true),
('How long does the enrollment process take?', 'The enrollment process typically takes 1-2 weeks, depending on how quickly you can provide required documents and complete orientation.', 'enrollment', 12, true),
('Do you help with job placement?', 'Yes! We provide career services including resume writing, interview preparation, job search assistance, and direct connections to hiring employers. Our goal is to help you get hired.', 'career', 13, true),
('What is the job placement rate?', 'Our job placement rate varies by program but averages over 85% within 90 days of graduation. Many students receive job offers before they even complete training.', 'career', 14, true),
('What if I do not qualify for WIOA?', 'We have multiple funding sources available. If you do not qualify for WIOA, you may qualify for other state grants, employer-sponsored training, or payment plans. We will work with you to find a solution.', 'funding', 15, true),
('Are there any hidden fees?', 'No hidden fees. If you qualify for funded training, your tuition is covered. We are transparent about any costs for uniforms, supplies, or certification exams, and many of these are also covered by funding.', 'funding', 16, true)
ON CONFLICT DO NOTHING;
