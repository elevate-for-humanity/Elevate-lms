-- Fix Supabase linter: SECURITY DEFINER views
-- https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
--
-- nds_course_catalog and program_catalog don't need SECURITY DEFINER —
-- they just filter active rows from tables that authenticated can already read.
-- Recreate them as SECURITY INVOKER so RLS of the underlying tables applies.
--
-- sfc_tax_return_public_status intentionally uses SECURITY DEFINER because
-- anon users need to read masked data from sfc_tax_returns (which anon cannot
-- access directly). This is the correct pattern for a PII-masking view.
-- We add an explicit comment documenting the security decision.

-- 1. nds_course_catalog → SECURITY INVOKER
CREATE OR REPLACE VIEW public.nds_course_catalog
WITH (security_invoker = true) AS
SELECT
  id,
  course_code,
  course_name,
  description,
  category,
  duration_hours,
  nds_wholesale_cost,
  elevate_retail_price,
  markup_percentage,
  stripe_product_id,
  stripe_price_id,
  external_course_url,
  certification_name,
  is_active,
  is_new,
  is_popular
FROM nds_training_courses
WHERE is_active = true
ORDER BY
  CASE category
    WHEN 'Supervisor Training' THEN 1
    WHEN 'Employee Training' THEN 2
    WHEN 'Collector Certification' THEN 3
    WHEN 'DER Training' THEN 4
    WHEN 'Advanced Training' THEN 5
    ELSE 6
  END,
  elevate_retail_price ASC;

-- 2. program_catalog → SECURITY INVOKER
CREATE OR REPLACE VIEW public.program_catalog
WITH (security_invoker = true) AS
SELECT
  id,
  slug,
  name,
  category,
  description,
  duration_formatted,
  tuition_dollars,
  total_cost_dollars,
  stripe_product_id,
  stripe_price_id,
  funding_types,
  wioa_eligible,
  wrg_eligible,
  apprenticeship_registered,
  certification_name
FROM training_programs
WHERE is_active = true
ORDER BY category, name;

-- 3. sfc_tax_return_public_status — intentionally SECURITY DEFINER.
-- Document the decision so future reviewers and the linter context are clear.
COMMENT ON VIEW public.sfc_tax_return_public_status IS
  'SECURITY DEFINER by design: anon users query this view for refund tracking. '
  'The view masks PII from sfc_tax_returns (exposes only tracking_id, mapped status, '
  'sanitized rejection_reason, timestamps, first name, last initial). '
  'anon has no direct access to sfc_tax_returns — the DEFINER privilege is required. '
  'ANY modification requires security review.';
