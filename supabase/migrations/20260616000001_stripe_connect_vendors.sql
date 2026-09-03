-- Stripe Connect Vendor Infrastructure
-- For phlebotomy and other third-party courses

-- Vendor accounts table
CREATE TABLE IF NOT EXISTS public.vendor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_email TEXT,
  stripe_connected_account_id TEXT,
  payout_method TEXT DEFAULT 'manual' CHECK (payout_method IN ('manual', 'stripe_connect')),
  bank_account_last4 TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course to vendor links
CREATE TABLE IF NOT EXISTS public.course_vendor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendor_accounts(id),
  vendor_cost_cents INTEGER NOT NULL,
  retail_price_cents INTEGER NOT NULL,
  payout_mode TEXT DEFAULT 'manual' CHECK (payout_mode IN ('manual', 'stripe_connect')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_slug)
);

-- Student enrollments
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id),
  course_slug TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  amount_paid_cents INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'enrolled', 'active', 'completed', 'cancelled')),
  access_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_slug)
);

-- Vendor payout tasks
CREATE TABLE IF NOT EXISTS public.vendor_payout_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendor_accounts(id),
  student_id UUID REFERENCES public.profiles(id),
  course_slug TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_vendor_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payout_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow admin access to vendor_accounts" ON public.vendor_accounts
  FOR ALL USING (auth.role() IN ('authenticated'))
  WITH CHECK (auth.role() IN ('authenticated'));

CREATE POLICY "Allow admin access to course_vendor_links" ON public.course_vendor_links
  FOR ALL USING (auth.role() IN ('authenticated'))
  WITH CHECK (auth.role() IN ('authenticated'));

CREATE POLICY "Allow admin access to student_enrollments" ON public.student_enrollments
  FOR ALL USING (auth.role() IN ('authenticated'))
  WITH CHECK (auth.role() IN ('authenticated'));

CREATE POLICY "Allow admin access to vendor_payout_tasks" ON public.vendor_payout_tasks
  FOR ALL USING (auth.role() IN ('authenticated'))
  WITH CHECK (auth.role() IN ('authenticated'));
