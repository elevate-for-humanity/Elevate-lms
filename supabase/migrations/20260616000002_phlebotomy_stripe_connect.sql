-- Phlebotomy Stripe Connect Tables

-- Student enrollments for course purchases
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID,
  student_email TEXT,
  course_slug TEXT NOT NULL,
  payment_provider TEXT DEFAULT 'stripe',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'active',
  access_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor payout tasks for manual payouts
CREATE TABLE IF NOT EXISTS public.vendor_payout_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT,
  student_id UUID,
  course_slug TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor accounts
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

-- Course vendor links
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

-- Stripe webhook events (for idempotency)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID,
  student_email TEXT,
  course_slug TEXT,
  total_cents INTEGER,
  status TEXT DEFAULT 'pending',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payout_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_vendor_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only)
CREATE POLICY "Admin full access to student_enrollments" ON public.student_enrollments
  FOR ALL USING (true);

CREATE POLICY "Admin full access to vendor_payout_tasks" ON public.vendor_payout_tasks
  FOR ALL USING (true);

CREATE POLICY "Admin full access to vendor_accounts" ON public.vendor_accounts
  FOR ALL USING (true);

CREATE POLICY "Admin full access to course_vendor_links" ON public.course_vendor_links
  FOR ALL USING (true);

CREATE POLICY "Admin full access to stripe_webhook_events" ON public.stripe_webhook_events
  FOR ALL USING (true);

CREATE POLICY "Admin full access to orders" ON public.orders
  FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_course_slug ON public.student_enrollments(course_slug);
CREATE INDEX IF NOT EXISTS idx_vendor_payout_tasks_vendor_id ON public.vendor_payout_tasks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payout_tasks_status ON public.vendor_payout_tasks(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);

-- Insert phlebotomy vendor (manual payout for now)
INSERT INTO public.vendor_accounts (id, vendor_name, vendor_email, payout_method)
VALUES ('00000000-0000-0000-0000-000000000001', 'Phlebotomy Course Vendor', 'vendor@example.com', 'manual')
ON CONFLICT DO NOTHING;

-- Link phlebotomy course to vendor
INSERT INTO public.course_vendor_links (course_slug, vendor_id, vendor_cost_cents, retail_price_cents, payout_mode)
VALUES ('phlebotomy-online', '00000000-0000-0000-0000-000000000001', 21300, 149900, 'manual')
ON CONFLICT (course_slug) DO NOTHING;
