-- ---------------------------------------------------------------------------
-- Exam fee Stripe product columns + EPA 608 fee records
--
-- Adds stripe_product_id, stripe_price_id, exam_fee_cents to credentials.
-- Seeds four EPA 608 exam fee rows — one per provider/format combination.
--
-- Pricing (confirmed 2026):
--   ESCO Group:            $38.00 paper or online, no free retests
--   Mainstream Engineering: $26.51 online (unlimited free retests)
--                           $31.82 paper
--
-- After applying this migration, run the Stripe sync script:
--   node scripts/sync-exam-fee-stripe-products.cjs
-- to create the Stripe products and write back stripe_product_id / stripe_price_id.
-- ---------------------------------------------------------------------------

-- ── 1. Add Stripe + fee columns to credentials ────────────────────────────

ALTER TABLE public.credentials
  ADD COLUMN IF NOT EXISTS exam_fee_cents     INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_product_id  TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id    TEXT,
  ADD COLUMN IF NOT EXISTS exam_provider      TEXT,   -- 'esco' | 'mainstream'
  ADD COLUMN IF NOT EXISTS exam_format        TEXT;   -- 'online' | 'paper'

COMMENT ON COLUMN public.credentials.exam_fee_cents    IS 'Exam fee in cents charged to self-pay students. NULL = covered by program tuition or funding.';
COMMENT ON COLUMN public.credentials.stripe_product_id IS 'Stripe product ID for this exam fee. Populated by sync script.';
COMMENT ON COLUMN public.credentials.stripe_price_id   IS 'Stripe price ID for this exam fee. Populated by sync script.';
COMMENT ON COLUMN public.credentials.exam_provider     IS 'Certifying body: esco | mainstream';
COMMENT ON COLUMN public.credentials.exam_format       IS 'Delivery format: online | paper';

-- ── 2. Seed EPA 608 exam fee credential rows ──────────────────────────────

INSERT INTO public.credentials
  (id, name, abbreviation, description,
   issuer_type, issuing_authority, issuing_authority_url,
   proctor_authority, delivery,
   requires_exam, exam_type, exam_location, passing_score,
   verification_source, verification_url,
   wioa_eligible, dol_registered,
   credential_stack, stack_level,
   exam_fee_cents, exam_provider, exam_format,
   is_active, is_published, metadata)
VALUES

  -- ESCO online
  ('e6080000-0000-0000-0000-000000000001',
   'EPA Section 608 Universal — ESCO Group (Online)',
   'EPA-608-ESCO-ONLINE',
   'Federal refrigerant handling certification. Proctored on-site at Elevate by Elizabeth Greene (ESCO Proctor ID: 358010). Online exam format.',
   'elevate_proctored',
   'ESCO Group',
   'https://escogroup.org',
   'elevate',
   'hybrid',
   true, 'proctored', 'on_site', 70,
   'external_link', 'https://escogroup.org',
   true, true,
   'hvac_trades', 'intermediate',
   3800, 'esco', 'online',
   true, true,
   '{"free_retests": false, "proctor_id": "358010", "study_kit_included": true}'::jsonb),

  -- ESCO paper
  ('e6080000-0000-0000-0000-000000000002',
   'EPA Section 608 Universal — ESCO Group (Paper)',
   'EPA-608-ESCO-PAPER',
   'Federal refrigerant handling certification. Proctored on-site at Elevate by Elizabeth Greene (ESCO Proctor ID: 358010). Paper exam format.',
   'elevate_proctored',
   'ESCO Group',
   'https://escogroup.org',
   'elevate',
   'hybrid',
   true, 'proctored', 'on_site', 70,
   'external_link', 'https://escogroup.org',
   true, true,
   'hvac_trades', 'intermediate',
   3800, 'esco', 'paper',
   true, true,
   '{"free_retests": false, "proctor_id": "358010", "study_kit_included": true}'::jsonb),

  -- Mainstream online
  ('e6080000-0000-0000-0000-000000000003',
   'EPA Section 608 Universal — Mainstream Engineering (Online)',
   'EPA-608-MAINSTREAM-ONLINE',
   'Federal refrigerant handling certification via Mainstream Engineering / EPATest.com. Online exam with unlimited free retests.',
   'elevate_proctored',
   'Mainstream Engineering Corporation',
   'https://ww2.epatest.com',
   'elevate',
   'hybrid',
   true, 'proctored', 'on_site', 70,
   'external_link', 'https://securesite.mainstream-engr.com/cert-lookup/',
   true, true,
   'hvac_trades', 'intermediate',
   2651, 'mainstream', 'online',
   true, true,
   '{"free_retests": true, "free_retests_note": "Unlimited free retests on online exams", "study_kit_included": true}'::jsonb),

  -- Mainstream paper
  ('e6080000-0000-0000-0000-000000000004',
   'EPA Section 608 Universal — Mainstream Engineering (Paper)',
   'EPA-608-MAINSTREAM-PAPER',
   'Federal refrigerant handling certification via Mainstream Engineering / EPATest.com. Paper exam format.',
   'elevate_proctored',
   'Mainstream Engineering Corporation',
   'https://ww2.epatest.com',
   'elevate',
   'hybrid',
   true, 'proctored', 'on_site', 70,
   'external_link', 'https://securesite.mainstream-engr.com/cert-lookup/',
   true, true,
   'hvac_trades', 'intermediate',
   3182, 'mainstream', 'paper',
   true, true,
   '{"free_retests": false, "study_kit_included": true}'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  exam_fee_cents    = EXCLUDED.exam_fee_cents,
  exam_provider     = EXCLUDED.exam_provider,
  exam_format       = EXCLUDED.exam_format,
  metadata          = EXCLUDED.metadata,
  is_active         = EXCLUDED.is_active;
