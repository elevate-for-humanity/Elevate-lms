-- ============================================================================
-- CONTENT MANAGEMENT TABLES
-- All site content stored in database, no hardcoded fake data
-- ============================================================================

-- ============================================================================
-- 1. TESTIMONIALS TABLE (if not exists, enhance it)
-- ============================================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT, -- e.g., "CNA Graduate", "Tax Customer"
  location TEXT, -- e.g., "Indianapolis, IN"
  quote TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  video_url TEXT,
  program_slug TEXT, -- links to specific program
  service_type TEXT, -- 'tax', 'training', 'career_services'
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
  department TEXT, -- 'leadership', 'instructors', 'staff', 'advisors'
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
  program_completed TEXT NOT NULL,
  graduation_date DATE,
  current_job_title TEXT,
  current_employer TEXT,
  story TEXT NOT NULL,
  quote TEXT,
  image_url TEXT,
  video_url TEXT,
  salary_before DECIMAL(10,2),
  salary_after DECIMAL(10,2),
  featured BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. FAQ TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'general', 'programs', 'funding', 'enrollment'
  program_slug TEXT, -- for program-specific FAQs
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SITE CONTENT TABLE (for misc content blocks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  body TEXT,
  image_url TEXT,
  cta_text TEXT,
  cta_url TEXT,
  metadata JSONB DEFAULT '{}',
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
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'IN',
  zip_code TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  hours JSONB, -- {"mon": "9am-5pm", "tue": "9am-5pm", ...}
  is_main_office BOOLEAN DEFAULT false,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. PARTNERS TABLE (employer partners, workforce partners)
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL, -- 'employer', 'workforce', 'training', 'government'
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. BLOG POSTS TABLE
-- ============================================================================
-- blog_posts table already exists from 20260113_blog_and_social.sql
-- Using status column ('draft', 'published', 'archived') instead of is_published boolean

-- ============================================================================
-- 9. EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'info_session', -- 'info_session', 'workshop', 'career_fair', 'graduation'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_id UUID REFERENCES locations(id),
  virtual_url TEXT,
  is_virtual BOOLEAN DEFAULT false,
  registration_url TEXT,
  max_attendees INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES - Public read access for content
-- ============================================================================

-- Testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view approved testimonials" ON testimonials;
CREATE POLICY "Public can view approved testimonials" ON testimonials
  FOR SELECT USING (approved = true);

-- Team Members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active team members" ON team_members;
CREATE POLICY "Public can view active team members" ON team_members
  FOR SELECT USING (is_active = true);

-- Success Stories
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view approved success stories" ON success_stories;
CREATE POLICY "Public can view approved success stories" ON success_stories
  FOR SELECT USING (approved = true);

-- FAQs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active faqs" ON faqs;
CREATE POLICY "Public can view active faqs" ON faqs
  FOR SELECT USING (is_active = true);

-- Site Content
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active site content" ON site_content;
CREATE POLICY "Public can view active site content" ON site_content
  FOR SELECT USING (is_active = true);

-- Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active locations" ON locations;
CREATE POLICY "Public can view active locations" ON locations
  FOR SELECT USING (is_active = true);

-- Partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active partners" ON partners;
CREATE POLICY "Public can view active partners" ON partners
  FOR SELECT USING (is_active = true);

-- Blog Posts (uses 'published' boolean column)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (published = true);

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active events" ON events;
CREATE POLICY "Public can view active events" ON events
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- GRANTS for anonymous access
-- ============================================================================
GRANT SELECT ON testimonials TO anon;
GRANT SELECT ON team_members TO anon;
GRANT SELECT ON success_stories TO anon;
GRANT SELECT ON faqs TO anon;
GRANT SELECT ON site_content TO anon;
GRANT SELECT ON locations TO anon;
GRANT SELECT ON partners TO anon;
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON events TO anon;

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_testimonials_service ON testimonials(service_type);
CREATE INDEX IF NOT EXISTS idx_testimonials_program ON testimonials(program_slug);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_team_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page_slug);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
