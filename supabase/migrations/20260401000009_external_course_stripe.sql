-- External course Stripe billing fields
--
-- payer_rule controls who pays at checkout:
--   'sponsored' = Elevate pays when funding_source != 'self_pay', student pays when self_pay
--   'always_student' = student always pays regardless of funding source
--   'always_elevate'  = Elevate always covers (e.g. included in program fee)
--
-- login_instructions is populated by staff after Elevate purchases the course
-- on the partner site. The system emails this to the student automatically.
--
-- approved_at / approved_by are set by staff when they verify the uploaded credential.
-- Advancement is gated on approved_at IS NOT NULL.

ALTER TABLE program_external_courses
  ADD COLUMN IF NOT EXISTS stripe_product_id  text,
  ADD COLUMN IF NOT EXISTS stripe_price_id    text,
  ADD COLUMN IF NOT EXISTS cost_cents         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payer_rule         text NOT NULL DEFAULT 'sponsored'
    CHECK (payer_rule IN ('sponsored', 'always_student', 'always_elevate'));

-- Stripe session that triggered the purchase (student self-pay path)
ALTER TABLE external_course_completions
  ADD COLUMN IF NOT EXISTS stripe_session_id  text,
  ADD COLUMN IF NOT EXISTS elevate_sponsored  boolean NOT NULL DEFAULT false;

-- Login credentials staff enters after purchasing on partner site
ALTER TABLE external_course_completions
  ADD COLUMN IF NOT EXISTS login_sent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS login_instructions text;   -- username / temp password / URL

-- Staff approval of uploaded credential
ALTER TABLE external_course_completions
  ADD COLUMN IF NOT EXISTS approved_at        timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason   text;

-- Index for admin approval queue
CREATE INDEX IF NOT EXISTS idx_ext_completions_pending_approval
  ON external_course_completions(program_id)
  WHERE approved_at IS NULL AND certificate_url IS NOT NULL;
