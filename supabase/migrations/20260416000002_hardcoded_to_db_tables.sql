-- Convert hardcoded data to database-driven tables
-- Replaces: data/team.ts, data/training-partners.ts, data/state-licensing.ts,
--           lib/testing/proctoring-capabilities.ts, hardcoded FAQs,
--           hardcoded testimonials, hardcoded impact stats, partner_courses

-- ── team_members ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  title           text NOT NULL,
  org_role        text,                        -- e.g. 'Executive Leadership'
  bio             text,
  headshot_url    text,
  email           text,
  linkedin_url    text,
  display_order   integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── testimonials ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  title           text,                        -- e.g. 'CNA Graduate, 2024'
  program_slug    text,                        -- links to programs.slug
  quote           text NOT NULL,
  photo_url       text,
  rating          integer DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  show_on_home    boolean DEFAULT false,
  show_on_program boolean DEFAULT true,
  is_active       boolean DEFAULT true,
  display_order   integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── faqs ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faqs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question        text NOT NULL,
  answer          text NOT NULL,
  category        text NOT NULL,              -- e.g. 'funding', 'enrollment', 'programs'
  program_slug    text,                       -- null = site-wide, set = program-specific
  display_order   integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── testing_providers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testing_providers (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key                 text UNIQUE NOT NULL,   -- e.g. 'certiport', 'nha', 'workkeys'
  name                text NOT NULL,
  description         text,
  logo_url            text,
  image_url           text,
  website_url         text,
  proctoring_type     text NOT NULL,          -- 'IN_PERSON_ONLY' | 'IN_PERSON_OR_PROVIDER_REMOTE' | 'CENTER_REMOTE_ALLOWED'
  status              text DEFAULT 'active',  -- 'active' | 'coming_soon' | 'inactive'
  exams               jsonb DEFAULT '[]',     -- array of exam definitions
  fees                jsonb DEFAULT '[]',     -- array of fee structures
  display_order       integer DEFAULT 0,
  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── training_partners ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_partners (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name                text NOT NULL,
  slug                text UNIQUE,
  category            text NOT NULL,          -- 'barbershop' | 'healthcare' | 'cdl' | etc.
  training_role       text NOT NULL,          -- 'ojt' | 'clinical' | 'apprenticeship' | etc.
  address             text,
  city                text,
  state               text DEFAULT 'IN',
  zip                 text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  logo_url            text,
  website_url         text,
  rapids_employer_id  text,                   -- DOL RAPIDS employer ID if applicable
  mou_on_file         boolean DEFAULT false,
  status              text DEFAULT 'active',  -- 'active' | 'pending' | 'inactive'
  programs_list       text[],                 -- program names this partner supports
  notes               text,
  display_order       integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── state_licensing ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.state_licensing (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_type        text NOT NULL,          -- 'cna' | 'phlebotomy' | 'hvac' | etc.
  state               text NOT NULL,
  state_code          text NOT NULL,          -- 2-letter code
  available           boolean DEFAULT true,
  unavailable_reason  text,
  requirements_url    text,
  board_name          text,
  notes               text,
  display_order       integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── partner_types ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_types (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key             text UNIQUE NOT NULL,       -- e.g. 'employer', 'training-provider'
  title           text NOT NULL,
  description     text,
  icon            text,                       -- lucide icon name
  color           text,                       -- tailwind color class
  benefits        jsonb DEFAULT '[]',         -- array of benefit strings
  requirements    jsonb DEFAULT '[]',         -- array of requirement strings
  apply_href      text,                       -- where the apply button goes
  display_order   integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── partner_courses (micro-classes from 3rd party partners) ──────────────────
CREATE TABLE IF NOT EXISTS public.partner_courses (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_key         text NOT NULL,          -- 'hsi' | 'nrf' | 'jri'
  partner_name        text NOT NULL,
  course_key          text UNIQUE NOT NULL,   -- e.g. 'hsi-food-handler'
  title               text NOT NULL,
  description         text,
  duration_hours      numeric,
  credential          text,
  image_url           text,
  retail_price_cents  integer,                -- in cents, null = free/grant-funded
  stripe_price_id     text,                   -- Stripe price ID for checkout
  payment_link        text,                   -- direct Stripe payment link
  partner_url         text,                   -- 3rd party course URL
  funding_type        text DEFAULT 'paid',    -- 'paid' | 'grant' | 'wioa'
  category            text,                   -- 'food-safety' | 'retail' | 'workforce'
  is_active           boolean DEFAULT true,
  display_order       integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ── impact_stats (replace broken impact_statistics table) ────────────────────
CREATE TABLE IF NOT EXISTS public.impact_stats (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_key        text UNIQUE NOT NULL,       -- e.g. 'graduates', 'employers', 'programs'
  label           text NOT NULL,             -- e.g. 'Graduates Trained'
  value           text NOT NULL,             -- e.g. '2,400+' (display string)
  numeric_value   numeric,                   -- for sorting/calculations
  icon            text,                      -- lucide icon name
  color           text,                      -- tailwind color class
  show_on_home    boolean DEFAULT true,
  display_order   integer DEFAULT 0,
  updated_at      timestamptz DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON public.testimonials (is_active, show_on_home, program_slug);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs (category, is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_testing_providers_active ON public.testing_providers (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_training_partners_category ON public.training_partners (category, status);
CREATE INDEX IF NOT EXISTS idx_partner_courses_active ON public.partner_courses (is_active, partner_key, display_order);
CREATE INDEX IF NOT EXISTS idx_impact_stats_home ON public.impact_stats (show_on_home, display_order);

-- ── RLS: public read, admin write ─────────────────────────────────────────────
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_licensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;

-- Public read
DROP policy if exists "public_read_team_members" on public.team_members;
CREATE policy "public_read_team_members" on public.team_members     FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_testimonials" on public.testimonials;
CREATE policy "public_read_testimonials" on public.testimonials     FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_faqs" on public.faqs;
CREATE policy "public_read_faqs" on public.faqs             FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_testing_providers" on public.testing_providers;
CREATE policy "public_read_testing_providers" on public.testing_providers FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_training_partners" on public.training_partners;
CREATE policy "public_read_training_partners" on public.training_partners FOR SELECT USING (status = 'active');
DROP policy if exists "public_read_state_licensing" on public.state_licensing;
CREATE policy "public_read_state_licensing" on public.state_licensing  FOR SELECT USING (true);
DROP policy if exists "public_read_partner_types" on public.partner_types;
CREATE policy "public_read_partner_types" on public.partner_types    FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_partner_courses" on public.partner_courses;
CREATE policy "public_read_partner_courses" on public.partner_courses  FOR SELECT USING (is_active = true);
DROP policy if exists "public_read_impact_stats" on public.impact_stats;
CREATE policy "public_read_impact_stats" on public.impact_stats     FOR SELECT USING (true);

-- Admin write
DROP policy if exists "admin_all_team_members" on public.team_members;
CREATE policy "admin_all_team_members" on public.team_members     FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_testimonials" on public.testimonials;
CREATE policy "admin_all_testimonials" on public.testimonials     FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_faqs" on public.faqs;
CREATE policy "admin_all_faqs" on public.faqs             FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_testing_providers" on public.testing_providers;
CREATE policy "admin_all_testing_providers" on public.testing_providers FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_training_partners" on public.training_partners;
CREATE policy "admin_all_training_partners" on public.training_partners FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_state_licensing" on public.state_licensing;
CREATE policy "admin_all_state_licensing" on public.state_licensing  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_partner_types" on public.partner_types;
CREATE policy "admin_all_partner_types" on public.partner_types    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_partner_courses" on public.partner_courses;
CREATE policy "admin_all_partner_courses" on public.partner_courses  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));
DROP policy if exists "admin_all_impact_stats" on public.impact_stats;
CREATE policy "admin_all_impact_stats" on public.impact_stats     FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

