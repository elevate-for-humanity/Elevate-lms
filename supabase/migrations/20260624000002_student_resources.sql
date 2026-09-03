-- Student-facing resource links shown on /student-portal/resources
-- Replaces the hardcoded resource cards in resources/page.tsx

CREATE TABLE IF NOT EXISTS public.student_resources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  category      text NOT NULL DEFAULT 'general',  -- 'academic', 'career', 'financial', 'technical', 'general'
  icon          text,                              -- lucide icon name
  href          text NOT NULL,
  external      boolean NOT NULL DEFAULT false,
  badge         text,                              -- optional badge text e.g. 'Free', 'New'
  display_order integer NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_resources_category ON public.student_resources (category);
CREATE INDEX IF NOT EXISTS idx_student_resources_order   ON public.student_resources (display_order);

-- Seed canonical resources (mirrors previous hardcoded cards)
INSERT INTO public.student_resources (title, description, category, icon, href, external, badge, display_order) VALUES
('Digital Library',       'Access thousands of textbooks, journals, and study materials',          'academic',  'BookOpen',    '/lms/library',          false, null,   1),
('Tutoring Center',       'One-on-one and group tutoring sessions with certified tutors',           'academic',  'Users',       '/tutoring',             false, 'Free', 2),
('Writing Center',        'Get feedback on essays, reports, and professional documents',            'academic',  'FileText',    '/writing-center',       false, 'Free', 3),
('Career Services',       'Resume help, interview prep, and job placement assistance',              'career',    'Briefcase',   '/career-services',      false, null,   4),
('IT Help Desk',          'Technical support for LMS access, software, and devices',               'technical', 'Monitor',     '/lms/help',             false, null,   5),
('Study Materials',       'Download practice tests, flashcards, and study guides',                 'academic',  'Download',    '/lms/files',            false, null,   6),
('Financial Aid',         'Scholarships, grants, and payment plan information',                    'financial', 'DollarSign',  '/financial-aid',        false, null,   7),
('Student Community',     'Connect with classmates, join study groups, and share resources',       'general',   'MessageCircle', '/lms/community',      false, null,   8)
ON CONFLICT DO NOTHING;

-- RLS: any authenticated user can read active resources; admins can write
ALTER TABLE public.student_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_resources_read" ON public.student_resources;
DO $$ BEGIN CREATE POLICY "student_resources_read" ON public.student_resources
  FOR SELECT USING (active = true AND auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "student_resources_admin_write" ON public.student_resources;
DO $$ BEGIN CREATE POLICY "student_resources_admin_write" ON public.student_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
