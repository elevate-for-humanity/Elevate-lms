-- Tutorials table for /help/tutorials
-- Replaces hardcoded array in page.tsx

CREATE TABLE IF NOT EXISTS public.tutorials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text,
  category      text NOT NULL,
  thumbnail_url text,
  video_url     text,
  duration      text,
  is_published  boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published tutorials
CREATE POLICY "tutorials_read" ON public.tutorials
  FOR SELECT USING (is_published = true);

-- Admins can manage all tutorials
CREATE POLICY "tutorials_admin" ON public.tutorials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Seed the 12 existing tutorials from the hardcoded array
INSERT INTO public.tutorials (slug, title, description, category, duration, sort_order) VALUES
  ('getting-started',         'Getting Started with Elevate LMS',       'Learn how to navigate the platform and set up your learner profile.',                                    'Getting Started', '5 min',  1),
  ('enrolling-in-courses',    'Enrolling in Courses',                    'Step-by-step guide to finding and enrolling in your first course.',                                      'Getting Started', '4 min',  2),
  ('completing-lessons',      'Completing Lessons and Tracking Progress','How to work through lessons, mark them complete, and monitor your progress.',                            'Learning',        '6 min',  3),
  ('taking-quizzes',          'Taking Quizzes and Assessments',          'Tips for completing quizzes, understanding your scores, and retaking assessments.',                      'Learning',        '5 min',  4),
  ('downloading-certificates','Downloading Your Certificates',           'How to access and download your completion certificates after finishing a course.',                      'Certificates',    '3 min',  5),
  ('sharing-credentials',     'Sharing Your Credentials',                'Share your certificates and credentials with employers and on LinkedIn.',                                'Certificates',    '4 min',  6),
  ('managing-profile',        'Managing Your Profile',                   'Update your personal information, profile photo, and notification preferences.',                         'Account',         '4 min',  7),
  ('payment-financial-aid',   'Payment and Financial Aid Options',       'Understand your payment options, financial aid eligibility, and how to apply for funding.',              'Account',         '7 min',  8),
  ('mobile-app',              'Using the Mobile App',                    'Access your courses on the go with the Elevate mobile experience.',                                      'Getting Started', '5 min',  9),
  ('live-sessions',           'Joining Live Sessions',                   'How to join live instructor sessions, webinars, and virtual office hours.',                              'Learning',        '6 min', 10),
  ('technical-requirements',  'Technical Requirements',                  'System requirements, browser compatibility, and troubleshooting common technical issues.',               'Support',         '4 min', 11),
  ('contacting-support',      'Contacting Support',                      'How to reach our support team, submit a ticket, and get help when you need it.',                        'Support',         '3 min', 12)
ON CONFLICT (slug) DO NOTHING;
