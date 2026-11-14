-- Career Services Courses/Products
-- These are purchasable video courses for career development

-- Create career_courses table
CREATE TABLE IF NOT EXISTS career_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  duration_hours DECIMAL(4,1),
  lesson_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  is_bundle BOOLEAN DEFAULT false,
  bundle_course_ids UUID[] DEFAULT '{}',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_features table (what's included)
CREATE TABLE IF NOT EXISTS career_course_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID,
  feature TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_modules table (curriculum)
CREATE TABLE IF NOT EXISTS career_course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_purchases table
CREATE TABLE IF NOT EXISTS career_course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID,
  email TEXT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'completed',
  purchased_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(user_id, course_id)
);

-- Create indexes
ALTER TABLE career_courses ADD COLUMN IF NOT EXISTS is_active TEXT;
CREATE INDEX IF NOT EXISTS idx_career_courses_active ON career_courses(is_active);
ALTER TABLE career_courses ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE INDEX IF NOT EXISTS idx_career_courses_slug ON career_courses(slug);
ALTER TABLE career_course_purchases ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_career_course_purchases_user ON career_course_purchases(user_id);
ALTER TABLE career_course_purchases ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_career_course_purchases_email ON career_course_purchases(email);

-- Enable RLS
ALTER TABLE career_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for career_courses (public read)
DROP POLICY IF EXISTS "Anyone can view active courses" ON career_courses;
CREATE POLICY "Anyone can view active courses" ON career_courses
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage courses" ON career_courses;
CREATE POLICY "Admins can manage courses" ON career_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policies for features (public read)
DROP POLICY IF EXISTS "Anyone can view course features" ON career_course_features;
CREATE POLICY "Anyone can view course features" ON career_course_features
  FOR SELECT USING (true);

-- Policies for modules (purchased users or preview)
DROP POLICY IF EXISTS "Anyone can view preview modules" ON career_course_modules;
CREATE POLICY "Anyone can view preview modules" ON career_course_modules
  FOR SELECT USING (is_preview = true);

DROP POLICY IF EXISTS "Purchased users can view all modules" ON career_course_modules;
CREATE POLICY "Purchased users can view all modules" ON career_course_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM career_course_purchases
      WHERE career_course_purchases.course_id = career_course_modules.course_id
      AND career_course_purchases.user_id = auth.uid()
      AND career_course_purchases.status = 'completed'
    )
  );

-- Policies for purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON career_course_purchases;
CREATE POLICY "Users can view own purchases" ON career_course_purchases
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert purchases" ON career_course_purchases;
CREATE POLICY "System can insert purchases" ON career_course_purchases
  FOR INSERT WITH CHECK (true);

-- Insert the courses
INSERT INTO career_courses (slug, title, subtitle, description, price, original_price, image_url, duration_hours, lesson_count, is_bestseller) VALUES
(
  'resume-mastery',
  'Resume Mastery',
  'Build a Resume That Gets Interviews',
  'Learn how to create a professional, ATS-optimized resume that stands out to employers. Includes templates, examples, and step-by-step video guidance.',
  197.00,
  297.00,
  '/images/programs-hq/business-training.jpg',
  3.0,
  12,
  true
),
(
  'interview-domination',
  'Interview Domination',
  'Ace Any Interview With Confidence',
  'Master the art of interviewing with proven techniques, mock interview practice, and insider strategies from hiring managers.',
  297.00,
  397.00,
  '/images/programs-hq/medical-assistant.jpg',
  4.0,
  16,
  false
),
(
  'job-search-accelerator',
  'Job Search Accelerator',
  'Land Your Dream Job in 30 Days',
  'A complete job search system with networking strategies, application tracking, and proven methods to get hired faster.',
  397.00,
  497.00,
  '/images/heroes-hq/career-services-hero.jpg',
  5.0,
  20,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- Insert the bundle
INSERT INTO career_courses (slug, title, subtitle, description, price, original_price, image_url, duration_hours, lesson_count, is_bundle, bundle_course_ids) 
SELECT 
  'career-launch-bundle',
  'Career Launch Bundle',
  'Complete Career Transformation Package',
  'Get all 3 courses plus exclusive bonuses. Everything you need to land your dream job.',
  597.00,
  891.00,
  '/images/heroes-hq/about-hero.jpg',
  12.0,
  48,
  true,
  ARRAY(SELECT id FROM career_courses WHERE slug IN ('resume-mastery', 'interview-domination', 'job-search-accelerator'))
ON CONFLICT (slug) DO NOTHING;

-- Insert features for Resume Mastery
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES
    ('12 HD video lessons', 1),
    ('5 professional resume templates', 2),
    ('ATS optimization checklist', 3),
    ('Cover letter templates', 4),
    ('LinkedIn profile guide', 5),
    ('Lifetime access', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'resume-mastery';

-- Insert features for Interview Domination
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES
    ('16 HD video lessons', 1),
    ('Mock interview recordings', 2),
    ('STAR method worksheets', 3),
    ('50+ common questions answered', 4),
    ('Salary negotiation scripts', 5),
    ('Follow-up email templates', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'interview-domination';

-- Insert features for Job Search Accelerator
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES
    ('20 HD video lessons', 1),
    ('Job search tracker spreadsheet', 2),
    ('Networking scripts & templates', 3),
    ('Hidden job market strategies', 4),
    ('Personal branding guide', 5),
    ('Weekly action plans', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'job-search-accelerator';

-- Insert features for Bundle
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES
    ('All 3 courses included', 1),
    ('48 HD video lessons total', 2),
    ('1-on-1 Resume Review Session ($149 value)', 3),
    ('Private Community Access', 4),
    ('Monthly Live Q&A Calls', 5),
    ('Priority Email Support', 6),
    ('Save $294 vs buying separately', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'career-launch-bundle';

-- Insert modules for Resume Mastery
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, modules.title, modules.description, modules.duration, modules.sort_order, modules.is_preview FROM career_courses,
  (VALUES
    ('Introduction to Resume Writing', 'Overview of what makes a winning resume', 10, 1, true),
    ('Resume Fundamentals & Strategy', 'Understanding resume formats and when to use each', 15, 2, false),
    ('Contact Information Best Practices', 'How to present your contact info professionally', 8, 3, false),
    ('Writing a Powerful Summary', 'Craft a summary that grabs attention', 18, 4, false),
    ('Work Experience That Sells', 'Turn job duties into achievements', 25, 5, false),
    ('Writing Powerful Bullet Points', 'Action verbs and quantifiable results', 20, 6, false),
    ('Education & Certifications', 'Presenting your credentials effectively', 12, 7, false),
    ('Skills Section Optimization', 'Technical and soft skills that matter', 15, 8, false),
    ('ATS Optimization Secrets', 'Beat the applicant tracking systems', 22, 9, false),
    ('Industry-Specific Examples', 'Resume examples for different fields', 20, 10, false),
    ('Cover Letter Mastery', 'Write cover letters that get read', 18, 11, false),
    ('LinkedIn Profile Optimization', 'Align your LinkedIn with your resume', 15, 12, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'resume-mastery';

-- Insert modules for Interview Domination
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, modules.title, modules.description, modules.duration, modules.sort_order, modules.is_preview FROM career_courses,
  (VALUES
    ('Interview Success Mindset', 'Building confidence before the interview', 12, 1, true),
    ('Research & Preparation', 'How to research companies effectively', 15, 2, false),
    ('First Impressions Matter', 'Body language and presentation', 14, 3, false),
    ('Tell Me About Yourself', 'Crafting your personal pitch', 18, 4, false),
    ('Mastering the STAR Method', 'Structure your answers for impact', 25, 5, false),
    ('Behavioral Questions Deep Dive', 'Common questions and winning answers', 30, 6, false),
    ('Technical Interview Prep', 'Industry-specific question strategies', 22, 7, false),
    ('Situational Questions', 'How to handle hypothetical scenarios', 18, 8, false),
    ('Questions to Ask Employers', 'Show interest and gather intel', 12, 9, false),
    ('Virtual Interview Success', 'Zoom, Teams, and video interview tips', 15, 10, false),
    ('Panel Interview Strategies', 'Handle multiple interviewers', 14, 11, false),
    ('Handling Difficult Questions', 'Gaps, weaknesses, and tough topics', 20, 12, false),
    ('Salary Negotiation Tactics', 'Get paid what you deserve', 25, 13, false),
    ('Benefits Negotiation', 'Beyond salary - total compensation', 12, 14, false),
    ('Post-Interview Follow-Up', 'Thank you notes that stand out', 10, 15, false),
    ('Handling Rejection & Next Steps', 'Learn and improve from every interview', 10, 16, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'interview-domination';

-- Insert modules for Job Search Accelerator
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, modules.title, modules.description, modules.duration, modules.sort_order, modules.is_preview FROM career_courses,
  (VALUES
    ('Job Search Strategy Overview', 'Creating your 30-day action plan', 15, 1, true),
    ('Defining Your Target Role', 'Get clear on what you want', 18, 2, false),
    ('Building Your Personal Brand', 'Stand out in a crowded market', 22, 3, false),
    ('Optimizing Your Online Presence', 'LinkedIn, portfolios, and more', 20, 4, false),
    ('The Hidden Job Market', 'Find jobs before they are posted', 25, 5, false),
    ('Networking Fundamentals', 'Build relationships that lead to jobs', 20, 6, false),
    ('Informational Interviews', 'Learn and connect simultaneously', 15, 7, false),
    ('Networking Scripts & Templates', 'What to say and how to say it', 18, 8, false),
    ('Job Board Strategies', 'Use Indeed, LinkedIn, and others effectively', 15, 9, false),
    ('Company Research Deep Dive', 'Target companies strategically', 14, 10, false),
    ('Application Optimization', 'Tailor every application', 18, 11, false),
    ('Tracking Your Applications', 'Stay organized and follow up', 12, 12, false),
    ('Working with Recruiters', 'Leverage staffing agencies', 15, 13, false),
    ('Career Fairs & Events', 'Make the most of in-person opportunities', 12, 14, false),
    ('Managing Multiple Offers', 'A good problem to have', 15, 15, false),
    ('Evaluating Job Offers', 'Compare opportunities objectively', 18, 16, false),
    ('Making Your Decision', 'Choose the right opportunity', 12, 17, false),
    ('Giving Notice Professionally', 'Leave on good terms', 10, 18, false),
    ('First 90 Days Success Plan', 'Start strong in your new role', 20, 19, false),
    ('Long-Term Career Planning', 'Keep growing after you land the job', 15, 20, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'job-search-accelerator';
