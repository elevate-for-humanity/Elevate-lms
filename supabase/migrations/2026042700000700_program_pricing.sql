-- program_pricing
-- Per-program tuition and payment plan configuration.
-- All monetary values in cents. Calculator reads from here — nothing hardcoded in UI.

CREATE TABLE IF NOT EXISTS public.program_pricing (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug         text NOT NULL UNIQUE,
  program_name         text NOT NULL,

  -- Tuition
  tuition_cents        integer NOT NULL,          -- full self-pay cost
  deposit_min_cents    integer NOT NULL,          -- minimum deposit to start
  deposit_default_cents integer NOT NULL,         -- pre-filled deposit in calculator

  -- Payment plan
  payment_frequency    text NOT NULL DEFAULT 'weekly'
                         CHECK (payment_frequency IN ('weekly','biweekly','monthly')),
  payment_weeks        integer NOT NULL,          -- number of payment periods

  -- Stripe links (deposit and full-pay)
  stripe_deposit_url   text,
  stripe_full_url      text,

  -- Metadata
  notes                text,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read (calculator is public-facing), admin write
ALTER TABLE public.program_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_pricing_public_read" ON public.program_pricing;
DROP policy if exists "program_pricing_public_read" on public.program_pricing;
CREATE policy "program_pricing_public_read" on public.program_pricing FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "program_pricing_admin_write" ON public.program_pricing;
DROP policy if exists "program_pricing_admin_write" on public.program_pricing;
CREATE policy "program_pricing_admin_write" on public.program_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_program_pricing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_program_pricing_updated_at ON public.program_pricing;
CREATE TRIGGER trg_program_pricing_updated_at
  BEFORE UPDATE ON public.program_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_program_pricing_updated_at();

-- Seed data — all programs with self-pay options
INSERT INTO public.program_pricing
  (program_slug, program_name, tuition_cents, deposit_min_cents, deposit_default_cents,
   payment_frequency, payment_weeks, stripe_deposit_url, stripe_full_url, notes)
VALUES
  (
    'barber-apprenticeship',
    'Barber Apprenticeship',
    498000,   -- $4,980
    60000,    -- $600 minimum deposit
    174300,   -- $1,743 default (35%)
    'weekly',
    50,       -- (4980 - 1743) / ~$65/wk ≈ 50 weeks
    'https://buy.stripe.com/8x2bJ21986rletw0dN8EN0o',
    'https://buy.stripe.com/6oUdRa4lkaHB7141hR8EN0b',
    '2,000-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'cosmetology-apprenticeship',
    'Cosmetology Apprenticeship',
    600000,   -- $6,000
    60000,    -- $600 minimum
    210000,   -- $2,100 default (35%)
    'weekly',
    62,       -- (6000 - 2100) / ~$63/wk ≈ 62 weeks
    'https://buy.stripe.com/fZu00j2UUdnofsDcfDgIo0a',
    'https://buy.stripe.com/9B600jbrq1EGdkvgvTgIo09',
    '2,000-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'nail-technician-apprenticeship',
    'Nail Technician Apprenticeship',
    500000,   -- $5,000
    60000,    -- $600 minimum
    175000,   -- $1,750 default (35%)
    'weekly',
    52,       -- (5000 - 1750) / ~$63/wk ≈ 52 weeks
    'https://buy.stripe.com/cNicN52UU4QS4NZ1AZgIo06',
    'https://buy.stripe.com/bJedR91QQgzAfsD0wVgIo05',
    '600-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'esthetician-apprenticeship',
    'Esthetician Apprenticeship',
    600000,   -- $6,000
    60000,    -- $600 minimum
    210000,   -- $2,100 default (35%)
    'weekly',
    62,
    'https://buy.stripe.com/fZu4gzbrq2IK5S32F3gIo08',
    'https://buy.stripe.com/6oUbJ16762IK1BN1AZgIo07',
    '700-hour apprenticeship. Deposit = 35% of tuition.'
  ),
  (
    'hvac-technician',
    'HVAC Technician',
    499500,   -- $4,995
    60000,
    174825,   -- 35%
    'weekly',
    50,
    NULL,
    NULL,
    'WIOA-funded primary path. Self-pay available.'
  ),
  (
    'peer-recovery-specialist',
    'Peer Recovery Specialist',
    500000,   -- $5,000
    60000,
    175000,
    'weekly',
    52,
    NULL,
    NULL,
    'WIOA-funded primary path. Self-pay available.'
  ),
  (
    'esthetician',
    'Professional Esthetician & Client Services',
    457500,   -- $4,575
    60000,
    160125,   -- 35%
    'weekly',
    47,
    NULL,
    NULL,
    'WIOA-funded primary path. Self-pay available.'
  )
ON CONFLICT (program_slug) DO UPDATE SET
  tuition_cents         = EXCLUDED.tuition_cents,
  deposit_min_cents     = EXCLUDED.deposit_min_cents,
  deposit_default_cents = EXCLUDED.deposit_default_cents,
  payment_weeks         = EXCLUDED.payment_weeks,
  stripe_deposit_url    = EXCLUDED.stripe_deposit_url,
  stripe_full_url       = EXCLUDED.stripe_full_url,
  notes                 = EXCLUDED.notes,
  updated_at            = now();
