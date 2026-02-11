-- Tax Prep enrollment mapping (v2 - handles missing columns)
-- Run this instead of 20260210_tax_prep_enrollment_map.sql

-- Step 1: Add missing columns if they don't exist
DO $$
BEGIN
  -- funding_source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'funding_source'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN funding_source TEXT DEFAULT 'SELF_PAY';
  END IF;

  -- is_free_enrollment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'is_free_enrollment'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN is_free_enrollment BOOLEAN DEFAULT false;
  END IF;

  -- is_deposit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'is_deposit'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN is_deposit BOOLEAN DEFAULT false;
  END IF;

  -- auto_enroll
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'auto_enroll'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN auto_enroll BOOLEAN DEFAULT true;
  END IF;

  -- send_welcome_email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'send_welcome_email'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN send_welcome_email BOOLEAN DEFAULT true;
  END IF;

  -- enrollment_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'enrollment_type'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN enrollment_type TEXT DEFAULT 'program';
  END IF;

  -- description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'description'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN description TEXT;
  END IF;
END $$;

-- Step 2: Insert tax prep mappings
INSERT INTO stripe_price_enrollment_map (
  stripe_price_id,
  stripe_product_id,
  program_slug,
  enrollment_type,
  funding_source,
  is_deposit,
  is_free_enrollment,
  auto_enroll,
  send_welcome_email,
  description
) VALUES
-- WIOA $0 enrollment
(
  'price_1SzM1VIRNf5vPH3APvgSpKRU',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'WIOA',
  false,
  true,
  true,
  true,
  'Tax Prep & Financial Services - WIOA Funded $0'
),
-- Self-pay full ($4,950)
(
  'price_1SsY60IRNf5vPH3ApAUmWGJ9',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  false,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Full Payment $4,950'
),
-- Self-pay deposit ($1,650)
(
  'price_1SsY60IRNf5vPH3Adq5Rh9KO',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  true,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Deposit $1,650'
),
-- Self-pay installment ($825)
(
  'price_1SsY60IRNf5vPH3AbLFjmbm8',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  true,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Installment $825'
)
ON CONFLICT DO NOTHING;

-- Step 3: Verify
-- Run this after:
-- SELECT stripe_price_id, program_slug, funding_source, is_free_enrollment, description
-- FROM stripe_price_enrollment_map
-- WHERE program_slug = 'tax-prep-financial-services';
