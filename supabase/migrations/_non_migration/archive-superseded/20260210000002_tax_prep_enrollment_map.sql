-- Tax Preparation & Financial Services enrollment mapping
-- ETPL Program #10004627 - IRS VITA Track
-- Maps Stripe $0 WIOA price to auto-enrollment

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
