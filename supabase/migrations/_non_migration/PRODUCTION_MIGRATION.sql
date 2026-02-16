-- ============================================
-- PRODUCTION MIGRATION: ZERO-STUB CONTENT SYSTEM
-- 
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- This migration:
-- - Creates tables for marketing pages, program outcomes, student hours, tasks, announcements
-- - Adds placeholder-blocking triggers to prevent fake content
-- - Sets up RLS policies for proper access control
-- - Creates indexes for performance
-- ============================================

-- ============================================
-- 1. MARKETING CONTENT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS marketing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  hero_image TEXT NOT NULL,
  hero_image_alt TEXT NOT NULL,
  hero_variant TEXT NOT NULL DEFAULT 'split' CHECK (hero_variant IN ('full', 'split', 'illustration', 'video')),
  hero_video_src TEXT,
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES marketing_pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('text', 'features', 'cta', 'testimonial', 'stats', 'faq')),
  heading TEXT NOT NULL,
  body TEXT NOT NULL CHECK (length(body) > 10),
  section_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, section_order)
);

-- ============================================
-- 2. PROGRAM ENHANCEMENTS
-- ============================================

-- Add columns to programs table (safe - IF NOT EXISTS)
DO $$ 
BEGIN
  ALTER TABLE programs ADD COLUMN IF NOT EXISTS credential TEXT;
  ALTER TABLE programs ADD COLUMN IF NOT EXISTS required_hours INT;
  ALTER TABLE programs ADD COLUMN IF NOT EXISTS hero_image TEXT;
  ALTER TABLE programs ADD COLUMN IF NOT EXISTS hero_image_alt TEXT;
EXCEPTION WHEN undefined_table THEN
  -- programs table doesn't exist, skip
  NULL;
END $$;

CREATE TABLE IF NOT EXISTS program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (length(outcome) > 5),
  outcome_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, outcome_order)
);

CREATE TABLE IF NOT EXISTS program_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  requirement_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, requirement_order)
);

-- ============================================
-- 3. LMS STUDENT DATA TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS student_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  hours NUMERIC NOT NULL CHECK (hours > 0),
  description TEXT,
  logged_date DATE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) > 3),
  instructions TEXT NOT NULL CHECK (length(instructions) > 10),
  due_days INT NOT NULL CHECK (due_days > 0),
  task_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, task_order)
);

CREATE TABLE IF NOT EXISTS student_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES program_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  enrollment_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. TESTIMONIALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  program TEXT,
  program_completed TEXT,
  current_job_title TEXT,
  current_employer TEXT,
  quote TEXT NOT NULL CHECK (length(quote) > 20),
  image_url TEXT,
  salary_before INT,
  salary_after INT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. ANNOUNCEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (audience IN ('all', 'student', 'staff', 'partner', 'admin')),
  title TEXT NOT NULL CHECK (length(title) > 3),
  body TEXT NOT NULL CHECK (length(body) > 10),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'event', 'important', 'urgent')),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. PLACEHOLDER BLOCKING TRIGGER
-- Prevents fake/stub content at database level
-- ============================================

CREATE OR REPLACE FUNCTION block_placeholder_text()
RETURNS trigger AS $$
DECLARE
  check_text TEXT;
BEGIN
  -- Concatenate all text fields that might exist
  check_text := COALESCE(NEW.title, '') || ' ' || 
                COALESCE(NEW.body, '') || ' ' || 
                COALESCE(NEW.heading, '') || ' ' ||
                COALESCE(NEW.subtitle, '') || ' ' ||
                COALESCE(NEW.description, '') || ' ' ||
                COALESCE(NEW.instructions, '') || ' ' ||
                COALESCE(NEW.outcome, '') || ' ' ||
                COALESCE(NEW.requirement, '') || ' ' ||
                COALESCE(NEW.quote, '');
  
  check_text := lower(check_text);
  
  -- Check for placeholder patterns
  IF check_text LIKE '%coming soon%' THEN
    RAISE EXCEPTION 'Placeholder content not allowed: contains "coming soon"';
  END IF;
  
  IF check_text LIKE '%lorem ipsum%' THEN
    RAISE EXCEPTION 'Placeholder content not allowed: contains "lorem ipsum"';
  END IF;
  
  IF check_text LIKE '%placeholder%' THEN
    RAISE EXCEPTION 'Placeholder content not allowed: contains "placeholder"';
  END IF;
  
  IF check_text LIKE '%test content%' THEN
    RAISE EXCEPTION 'Placeholder content not allowed: contains "test content"';
  END IF;
  
  IF check_text LIKE '% tbd %' OR check_text LIKE '%tbd.%' OR check_text LIKE '%tbd,%' THEN
    RAISE EXCEPTION 'Placeholder content not allowed: contains "tbd"';
  END IF;
  
  IF check_text LIKE '%to be determined%' THEN
    RAISE EXCEPTION 'Placeholder content not allowed: contains "to be determined"';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS check_placeholder_marketing_pages ON marketing_pages;
CREATE TRIGGER check_placeholder_marketing_pages
  BEFORE INSERT OR UPDATE ON marketing_pages
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_marketing_sections ON marketing_sections;
CREATE TRIGGER check_placeholder_marketing_sections
  BEFORE INSERT OR UPDATE ON marketing_sections
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_announcements ON announcements;
CREATE TRIGGER check_placeholder_announcements
  BEFORE INSERT OR UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_program_outcomes ON program_outcomes;
CREATE TRIGGER check_placeholder_program_outcomes
  BEFORE INSERT OR UPDATE ON program_outcomes
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_program_tasks ON program_tasks;
CREATE TRIGGER check_placeholder_program_tasks
  BEFORE INSERT OR UPDATE ON program_tasks
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_program_requirements ON program_requirements;
CREATE TRIGGER check_placeholder_program_requirements
  BEFORE INSERT OR UPDATE ON program_requirements
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- Apply trigger to testimonials
DROP TRIGGER IF EXISTS check_placeholder_testimonials ON testimonials;
CREATE TRIGGER check_placeholder_testimonials
  BEFORE INSERT OR UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- ============================================
-- 7. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_marketing_pages_slug ON marketing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_marketing_pages_published ON marketing_pages(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_marketing_sections_page ON marketing_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_program_outcomes_program ON program_outcomes(program_id);
CREATE INDEX IF NOT EXISTS idx_student_hours_enrollment ON student_hours(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_hours_student ON student_hours(student_id);
CREATE INDEX IF NOT EXISTS idx_student_hours_verified ON student_hours(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_student_tasks_student ON student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_enrollment ON student_tasks(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published, audience) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(featured, published) WHERE featured = true AND published = true;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published testimonials" ON testimonials;
CREATE POLICY "Public can view published testimonials" ON testimonials
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;
CREATE POLICY "Admins can manage testimonials" ON testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Marketing pages
ALTER TABLE marketing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published marketing pages" ON marketing_pages;
CREATE POLICY "Public can view published marketing pages" ON marketing_pages
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins can manage marketing pages" ON marketing_pages;
CREATE POLICY "Admins can manage marketing pages" ON marketing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Marketing sections
ALTER TABLE marketing_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view marketing sections" ON marketing_sections;
CREATE POLICY "Public can view marketing sections" ON marketing_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM marketing_pages 
      WHERE marketing_pages.id = marketing_sections.page_id 
      AND marketing_pages.published = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage marketing sections" ON marketing_sections;
CREATE POLICY "Admins can manage marketing sections" ON marketing_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published announcements" ON announcements;
CREATE POLICY "Public can view published announcements" ON announcements
  FOR SELECT USING (
    published = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Student hours
ALTER TABLE student_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own hours" ON student_hours;
CREATE POLICY "Students can view own hours" ON student_hours
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can insert own hours" ON student_hours;
CREATE POLICY "Students can insert own hours" ON student_hours
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Staff can manage all hours" ON student_hours;
CREATE POLICY "Staff can manage all hours" ON student_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'instructor', 'admin', 'super_admin')
    )
  );

-- Student tasks
ALTER TABLE student_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own tasks" ON student_tasks;
CREATE POLICY "Students can view own tasks" ON student_tasks
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own tasks" ON student_tasks;
CREATE POLICY "Students can update own tasks" ON student_tasks
  FOR UPDATE USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Staff can manage all tasks" ON student_tasks;
CREATE POLICY "Staff can manage all tasks" ON student_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'instructor', 'admin', 'super_admin')
    )
  );

-- Program outcomes (public read)
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view program outcomes" ON program_outcomes;
CREATE POLICY "Public can view program outcomes" ON program_outcomes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage program outcomes" ON program_outcomes;
CREATE POLICY "Admins can manage program outcomes" ON program_outcomes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Program requirements (public read)
ALTER TABLE program_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view program requirements" ON program_requirements;
CREATE POLICY "Public can view program requirements" ON program_requirements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage program requirements" ON program_requirements;
CREATE POLICY "Admins can manage program requirements" ON program_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Program tasks (public read for structure)
ALTER TABLE program_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view program tasks" ON program_tasks;
CREATE POLICY "Public can view program tasks" ON program_tasks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage program tasks" ON program_tasks;
CREATE POLICY "Admins can manage program tasks" ON program_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE marketing_pages IS 'Database-backed marketing pages. No page renders without published=true.';
COMMENT ON TABLE marketing_sections IS 'Content sections for marketing pages. No empty sections allowed.';
COMMENT ON TABLE announcements IS 'System announcements. Only published announcements are visible.';
COMMENT ON TABLE student_hours IS 'Student training hours. Only verified hours count toward completion.';
COMMENT ON TABLE student_tasks IS 'Student task assignments and submissions.';
COMMENT ON TABLE program_outcomes IS 'Learning outcomes for programs. Displayed on program pages.';
COMMENT ON TABLE program_requirements IS 'Prerequisites/requirements for programs.';
COMMENT ON TABLE program_tasks IS 'Task templates for programs. Assigned to students on enrollment.';
COMMENT ON FUNCTION block_placeholder_text() IS 'Prevents placeholder/stub content from being saved to database.';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'Migration complete. Tables created: marketing_pages, marketing_sections, announcements, student_hours, student_tasks, program_outcomes, program_requirements, program_tasks' AS status;
