-- Handbook policies table
-- Replaces hardcoded POLICY_SECTIONS array in handbook/acknowledge/page.tsx
-- Each row is one policy section shown to students during onboarding acknowledgement.

CREATE TABLE IF NOT EXISTS public.handbook_policies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  title         text NOT NULL,
  description   text,
  icon          text,                        -- lucide icon name, e.g. 'Clock', 'Shield'
  key_points    text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handbook_policies_order ON public.handbook_policies (display_order);

-- Seed the five canonical policies (mirrors the previous hardcoded array)
INSERT INTO public.handbook_policies (slug, title, description, icon, key_points, display_order) VALUES
(
  'attendance',
  'Attendance Policy',
  'Requirements for class attendance and punctuality',
  'Clock',
  ARRAY[
    'Attend all scheduled classes and training sessions',
    'Notify your instructor at least 2 hours before any absence',
    'Maximum 2 unexcused absences per module',
    'Tardiness of 15+ minutes counts as a half-absence',
    'Make-up work required for all missed sessions'
  ],
  1
),
(
  'academic-integrity',
  'Academic Integrity',
  'Standards for honest and ethical academic work',
  'BookOpen',
  ARRAY[
    'All submitted work must be your own original work',
    'Plagiarism or cheating results in immediate dismissal',
    'Collaboration is encouraged but copying is prohibited',
    'Cite all sources used in assignments and projects',
    'AI-generated content must be disclosed to your instructor'
  ],
  2
),
(
  'conduct',
  'Code of Conduct',
  'Professional behavior standards in the learning environment',
  'Users',
  ARRAY[
    'Treat all students, instructors, and staff with respect',
    'Maintain a professional and inclusive learning environment',
    'Zero tolerance for harassment, discrimination, or bullying',
    'Dress code: business casual for in-person sessions',
    'Electronic devices used for learning purposes only during class'
  ],
  3
),
(
  'safety',
  'Safety Policy',
  'Workplace and lab safety requirements',
  'Shield',
  ARRAY[
    'Follow all safety protocols in lab and hands-on training areas',
    'Wear required personal protective equipment (PPE) at all times',
    'Report any unsafe conditions immediately to your instructor',
    'No horseplay or unsafe behavior in training areas',
    'Emergency procedures posted in all training rooms — know your exits'
  ],
  4
),
(
  'grievance',
  'Grievance Procedure',
  'Process for resolving concerns and complaints',
  'MessageSquare',
  ARRAY[
    'Raise concerns first with your instructor or program coordinator',
    'Formal grievances submitted in writing within 10 business days',
    'All grievances reviewed within 5 business days of receipt',
    'Retaliation against anyone filing a grievance is strictly prohibited',
    'Contact student services at info@elevateforhumanity.org for support'
  ],
  5
)
ON CONFLICT (slug) DO UPDATE SET
  title         = EXCLUDED.title,
  description   = EXCLUDED.description,
  icon          = EXCLUDED.icon,
  key_points    = EXCLUDED.key_points,
  display_order = EXCLUDED.display_order,
  updated_at    = now();

-- RLS: students can read active policies; only admins can write
ALTER TABLE public.handbook_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handbook_policies_read" ON public.handbook_policies;
DO $$ BEGIN CREATE POLICY "handbook_policies_read" ON public.handbook_policies
  FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "handbook_policies_admin_write" ON public.handbook_policies;
DO $$ BEGIN CREATE POLICY "handbook_policies_admin_write" ON public.handbook_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
