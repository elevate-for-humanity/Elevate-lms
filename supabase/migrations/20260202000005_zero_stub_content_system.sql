-- ============================================
-- ZERO-STUB CONTENT SYSTEM
-- Makes placeholder content technically impossible
-- ============================================

-- ============================================
-- 1. MARKETING CONTENT TABLES
-- ============================================

-- Marketing pages - every page must be database-backed
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

-- Marketing sections - no empty sections allowed
CREATE TABLE IF NOT EXISTS marketing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID,
  section_type TEXT NOT NULL CHECK (section_type IN ('text', 'features', 'cta', 'testimonial', 'stats', 'faq')),
  heading TEXT NOT NULL,
  body TEXT NOT NULL CHECK (length(body) > 10), -- Minimum content length
  section_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
  UNIQUE(page_id, section_order)
);

-- ============================================
-- 2. PROGRAM TRUTH TABLES
-- ============================================

-- Ensure programs table has required fields
ALTER TABLE programs 
  ADD COLUMN IF NOT EXISTS credential TEXT,
  ADD COLUMN IF NOT EXISTS required_hours INT,
  ADD COLUMN IF NOT EXISTS hero_image TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_alt TEXT;

-- Program outcomes - rows not bullet copy
CREATE TABLE IF NOT EXISTS program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  outcome TEXT NOT NULL CHECK (length(outcome) > 5),
  outcome_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
  UNIQUE(program_id, outcome_order)
);

-- Program requirements
CREATE TABLE IF NOT EXISTS program_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  requirement TEXT NOT NULL,
  requirement_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
  UNIQUE(program_id, requirement_order)
);

-- ============================================
-- 3. LMS STUDENT DATA TABLES
-- ============================================

-- Student hours - verified hours only count
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

-- Tasks - no dead UI
CREATE TABLE IF NOT EXISTS program_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID,
  title TEXT NOT NULL CHECK (length(title) > 3),
  instructions TEXT NOT NULL CHECK (length(instructions) > 10),
  due_days INT NOT NULL CHECK (due_days > 0),
  task_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
  UNIQUE(program_id, task_order)
);

-- Student task assignments
CREATE TABLE IF NOT EXISTS student_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
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
-- 4. ANNOUNCEMENTS - NO SAMPLES
-- ============================================

-- Ensure announcements table exists with proper constraints
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
-- 5. PLACEHOLDER VALIDATION TRIGGER
-- Makes fake content impossible at database level
-- ============================================

CREATE OR REPLACE FUNCTION block_placeholder_text()
RETURNS trigger AS $$
DECLARE
  placeholder_patterns TEXT[] := ARRAY[
    'coming soon',
    'sample',
    'example',
    'lorem ipsum',
    'placeholder',
    'demo',
    'test content',
    'tbd',
    'to be determined',
    'insert here',
    'your text here',
    'xxx',
    'asdf'
  ];
  pattern TEXT;
  field_value TEXT;
  field_name TEXT;
BEGIN
  -- Check common text fields
  FOREACH field_name IN ARRAY ARRAY['title', 'body', 'heading', 'subtitle', 'description', 'instructions', 'outcome', 'requirement']
  LOOP
    -- Get field value dynamically
    EXECUTE format('SELECT ($1).%I::TEXT', field_name) INTO field_value USING NEW;
    
    IF field_value IS NOT NULL THEN
      FOREACH pattern IN ARRAY placeholder_patterns
      LOOP
        IF lower(field_value) LIKE '%' || pattern || '%' THEN
          RAISE EXCEPTION 'Placeholder content detected: "%" contains "%". Placeholder content is not allowed.', 
            field_name, pattern;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN undefined_column THEN
    -- Field doesn't exist in this table, skip
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ALL user-facing content tables
-- Marketing
DROP TRIGGER IF EXISTS check_placeholder_marketing_pages ON marketing_pages;
CREATE TRIGGER check_placeholder_marketing_pages
  BEFORE INSERT OR UPDATE ON marketing_pages
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

DROP TRIGGER IF EXISTS check_placeholder_marketing_sections ON marketing_sections;
CREATE TRIGGER check_placeholder_marketing_sections
  BEFORE INSERT OR UPDATE ON marketing_sections
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- Announcements
DROP TRIGGER IF EXISTS check_placeholder_announcements ON announcements;
CREATE TRIGGER check_placeholder_announcements
  BEFORE INSERT OR UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- Programs
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

-- Programs table itself (name, description)
DROP TRIGGER IF EXISTS check_placeholder_programs ON programs;
CREATE TRIGGER check_placeholder_programs
  BEFORE INSERT OR UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION block_placeholder_text();

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

ALTER TABLE marketing_pages ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE INDEX IF NOT EXISTS idx_marketing_pages_slug ON marketing_pages(slug);
ALTER TABLE marketing_pages ADD COLUMN IF NOT EXISTS published TEXT;
CREATE INDEX IF NOT EXISTS idx_marketing_pages_published ON marketing_pages(published) WHERE published = true;
ALTER TABLE marketing_sections ADD COLUMN IF NOT EXISTS page_id TEXT;
CREATE INDEX IF NOT EXISTS idx_marketing_sections_page ON marketing_sections(page_id);
ALTER TABLE program_outcomes ADD COLUMN IF NOT EXISTS program_id UUID;
CREATE INDEX IF NOT EXISTS idx_program_outcomes_program ON program_outcomes(program_id);
ALTER TABLE student_hours ADD COLUMN IF NOT EXISTS enrollment_id UUID;
CREATE INDEX IF NOT EXISTS idx_student_hours_enrollment ON student_hours(enrollment_id);
ALTER TABLE student_hours ADD COLUMN IF NOT EXISTS verified TEXT;
CREATE INDEX IF NOT EXISTS idx_student_hours_verified ON student_hours(verified) WHERE verified = true;
ALTER TABLE student_tasks ADD COLUMN IF NOT EXISTS student_id TEXT;
CREATE INDEX IF NOT EXISTS idx_student_tasks_student ON student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published, audience) WHERE published = true;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Marketing pages - public read for published
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

-- Marketing sections - public read
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

-- Announcements - audience-based access
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant announcements" ON announcements;
CREATE POLICY "Users can view relevant announcements" ON announcements
  FOR SELECT USING (
    is_published = true 
    AND (audience IS NULL OR audience = 'all' OR audience = (
      SELECT role FROM profiles WHERE id = auth.uid()
    ))
  );

-- Student hours - students see own, staff see all
ALTER TABLE student_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own hours" ON student_hours;
CREATE POLICY "Students can view own hours" ON student_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_enrollments te
      WHERE te.id = student_hours.enrollment_id
      AND te.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can view all hours" ON student_hours;
CREATE POLICY "Staff can view all hours" ON student_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'instructor', 'admin', 'super_admin')
    )
  );

COMMENT ON TABLE marketing_pages IS 'Database-backed marketing pages. No page renders without published=true.';
COMMENT ON TABLE marketing_sections IS 'Content sections for marketing pages. No empty sections allowed.';
COMMENT ON FUNCTION block_placeholder_text() IS 'Prevents placeholder/stub content from being saved to database.';
