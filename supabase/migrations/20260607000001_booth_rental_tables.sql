-- Booth rental subscriptions
-- Tracks active Stripe subscriptions for booth/suite renters.

CREATE TABLE IF NOT EXISTS public.booth_rental_subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id       text UNIQUE,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  discipline              text NOT NULL CHECK (discipline IN ('barber', 'cosmetologist', 'nail_tech', 'esthetician')),
  renter_name             text NOT NULL,
  renter_email            text NOT NULL,
  booth_number            text,
  payment_status          text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'active', 'past_due', 'suspended', 'cancelled')),
  mou_signed              boolean NOT NULL DEFAULT false,
  mou_signed_at           timestamptz,
  days_past_due           integer NOT NULL DEFAULT 0,
  late_fee_total_cents    integer NOT NULL DEFAULT 0,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booth_rental_subscriptions_email    ON public.booth_rental_subscriptions (renter_email);
CREATE INDEX IF NOT EXISTS idx_booth_rental_subscriptions_status   ON public.booth_rental_subscriptions (payment_status);
CREATE INDEX IF NOT EXISTS idx_booth_rental_subscriptions_stripe   ON public.booth_rental_subscriptions (stripe_subscription_id);

-- Booth rental agreements (signed MOUs)
-- One row per signed agreement. Stores signature data URL for audit trail.

CREATE TABLE IF NOT EXISTS public.booth_rental_agreements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id   text,
  stripe_customer_id  text,
  discipline          text NOT NULL,
  renter_name         text NOT NULL,
  renter_email        text NOT NULL,
  printed_name        text NOT NULL,
  signature_data_url  text NOT NULL,
  signed_at           timestamptz NOT NULL,
  ip_address          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booth_rental_agreements_email    ON public.booth_rental_agreements (renter_email);
CREATE INDEX IF NOT EXISTS idx_booth_rental_agreements_session  ON public.booth_rental_agreements (stripe_session_id);

-- Apprentice hours — add discipline column if missing

ALTER TABLE public.apprentice_hours
  ADD COLUMN IF NOT EXISTS discipline text,
  ADD COLUMN IF NOT EXISTS total_minutes integer,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'practical',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();

-- RLS: staff and admin can read all booth rental records
ALTER TABLE public.booth_rental_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_rental_agreements    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read booth_rental_subscriptions"
  ON public.booth_rental_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Staff can read booth_rental_agreements"
  ON public.booth_rental_agreements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role can insert/update (used by API routes)
CREATE POLICY "Service role full access booth_rental_subscriptions"
  ON public.booth_rental_subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access booth_rental_agreements"
  ON public.booth_rental_agreements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
