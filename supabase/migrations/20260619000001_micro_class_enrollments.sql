-- micro_class_enrollments
-- Records a student's purchase of a partner micro-class (HSI, NRF, CareerSafe).
-- Created by the Stripe webhook at /api/micro-classes/webhook on checkout.session.completed.

CREATE TABLE IF NOT EXISTS public.micro_class_enrollments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           TEXT NOT NULL,                        -- e.g. 'careersafe-osha10-general'
  partner_id          TEXT NOT NULL,                        -- e.g. 'careersafe'
  student_email       TEXT NOT NULL,
  student_name        TEXT NOT NULL DEFAULT '',
  stripe_session_id   TEXT NOT NULL UNIQUE,
  stripe_price_id     TEXT NOT NULL,
  amount_paid_cents   INTEGER NOT NULL,
  vendor_cost_cents   INTEGER NOT NULL,                     -- for revenue tracking
  enrollment_url      TEXT NOT NULL,
  login_url           TEXT NOT NULL,
  access_email_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_micro_class_enrollments_email
  ON public.micro_class_enrollments (student_email);

CREATE INDEX IF NOT EXISTS idx_micro_class_enrollments_course
  ON public.micro_class_enrollments (course_id);

-- RLS: admins can read all; students can read their own by email
ALTER TABLE public.micro_class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all" ON public.micro_class_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "student_read_own" ON public.micro_class_enrollments
  FOR SELECT USING (
    student_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
