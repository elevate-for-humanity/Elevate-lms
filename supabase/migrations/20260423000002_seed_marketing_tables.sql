-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Apply schema (run this first if 20260423000001 not yet applied)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS tier          text,
  ADD COLUMN IF NOT EXISTS price         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interval      text,
  ADD COLUMN IF NOT EXISTS price_display text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS features      jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommended   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

ALTER TABLE public.impact_metrics
  ADD COLUMN IF NOT EXISTS category      text,
  ADD COLUMN IF NOT EXISTS label         text,
  ADD COLUMN IF NOT EXISTS value         text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

ALTER TABLE public.content_blocks
  ADD COLUMN IF NOT EXISTS page          text,
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS body          text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS image_url     text,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS order_index   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.offerings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  category      text,
  icon          text,
  image_url     text,
  cta_label     text,
  cta_href      text,
  features      jsonb DEFAULT '[]',
  order_index   integer DEFAULT 0,
  status        text DEFAULT 'active',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read offerings" ON public.offerings;
CREATE POLICY "Public read offerings" ON public.offerings
  FOR SELECT USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_content_blocks_page    ON public.content_blocks(page);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_category ON public.impact_metrics(category);
CREATE INDEX IF NOT EXISTS idx_offerings_status        ON public.offerings(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Seed impact_metrics
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.impact_metrics (category, label, value, description, display_order, is_active) VALUES
  ('learners',   'Learners Enrolled',          '500+',  'Total learners enrolled across all programs',                    1, true),
  ('learners',   'Credential Attainment Rate', '94%',   'Percentage of enrolled learners who earn their credential',      2, true),
  ('learners',   'Job Placement Rate',         '78%',   'Learners placed in employment within 90 days of completion',     3, true),
  ('employers',  'Employer Partners',          '40+',   'Employers actively hiring Elevate graduates',                    4, true),
  ('employers',  'Average Wage Gain',          '$8.50', 'Average hourly wage increase after program completion',          5, true),
  ('community',  'Counties Served',            '12',    'Indiana counties with active Elevate learners or partners',      6, true),
  ('funding',    'WIOA Participants',          '200+',  'Learners funded through WIOA Title I workforce grants',          7, true),
  ('funding',    'Grant Funding Secured',      '$1.2M', 'Total grant and public funding secured for learner support',     8, true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Seed content_blocks (what_we_do page)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.content_blocks (page, title, body, cta_label, cta_href, order_index, is_active) VALUES
  ('what_we_do', 'Workforce Training',
   'Industry-recognized credential programs in healthcare, skilled trades, technology, and business. Funded through WIOA, WRG, and employer partnerships.',
   'Browse Programs', '/programs', 1, true),
  ('what_we_do', 'Registered Apprenticeships',
   'DOL-registered apprenticeship programs in barbering, cosmetology, and skilled trades. Earn while you learn with structured on-the-job learning and related technical instruction.',
   'Learn More', '/apprenticeships', 2, true),
  ('what_we_do', 'Career Placement',
   'Job placement support, employer connections, resume coaching, and post-placement follow-up. We track outcomes and report to funding agencies.',
   'Get Started', '/contact', 3, true),
  ('what_we_do', 'Employer Partnerships',
   'We connect trained graduates directly to hiring employers. Customized training pipelines, on-site cohorts, and work-based learning agreements.',
   'Partner With Us', '/for-employers', 4, true),
  ('what_we_do', 'Funding Navigation',
   'We help learners access WIOA, WRG, Pell, and employer-sponsored funding to cover training costs. No out-of-pocket cost for eligible participants.',
   'Check Eligibility', '/apply', 5, true),
  ('what_we_do', 'Compliance & Reporting',
   'ETPL-approved, RAPIDS-reporting, and Perkins V-eligible. We handle all compliance documentation so funders and partners can trust the data.',
   'View Compliance', '/government', 6, true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Seed offerings
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.offerings (title, description, category, cta_label, cta_href, features, order_index, status) VALUES
  ('Credential Training Programs',
   'Short-term, industry-recognized credential programs in healthcare, skilled trades, technology, and business. Most programs complete in 4–16 weeks.',
   'training', 'Browse Programs', '/programs',
   '["EPA 608 HVAC Certification","CompTIA A+ & Security+","NHA Medical Assistant","Certiport Entrepreneurship","Barbering & Cosmetology"]',
   1, 'active'),
  ('Registered Apprenticeships',
   'DOL-registered apprenticeship programs combining paid on-the-job learning with related technical instruction. Earn while you learn.',
   'apprenticeship', 'Learn More', '/apprenticeships',
   '["Barbering Apprenticeship","Cosmetology Apprenticeship","Skilled Trades Pre-Apprenticeship","Employer-Sponsored Cohorts"]',
   2, 'active'),
  ('Employer Training Pipelines',
   'Custom training cohorts built around your hiring needs. We recruit, train, credential, and deliver job-ready candidates directly to your workforce.',
   'employer', 'Partner With Us', '/for-employers',
   '["Custom Cohort Design","On-Site or Hybrid Delivery","WOTC Assistance","Retention Support"]',
   3, 'active'),
  ('Funding & Financial Navigation',
   'We help learners access WIOA, WRG, Pell, and employer-sponsored funding. Eligible participants pay nothing out of pocket.',
   'funding', 'Check Eligibility', '/apply',
   '["WIOA Title I Funding","Workforce Ready Grant","Employer Sponsorship","Emergency Barrier Removal"]',
   4, 'active'),
  ('Career Placement Services',
   'Resume coaching, interview prep, employer introductions, and post-placement follow-up. We stay with learners through their first 90 days on the job.',
   'support', 'Get Started', '/contact',
   '["Resume & Interview Coaching","Employer Job Board","90-Day Follow-Up","Wage Tracking & Reporting"]',
   5, 'active'),
  ('Government & Agency Partnerships',
   'ETPL-approved, RAPIDS-reporting, and Perkins V-eligible. We serve as a compliant training partner for workforce boards, DWD, and K-12 CTE programs.',
   'government', 'Learn More', '/government',
   '["ETPL Approved","RAPIDS Reporting","Perkins V Eligible","WIOA Title I Compliant"]',
   6, 'active')
ON CONFLICT DO NOTHING;
