-- Sync partners.mou_signed from barbershop_partner_applications.mou_signed_at
--
-- The new barbershop onboarding flow writes mou_signed_at to
-- barbershop_partner_applications but does not update partners.mou_signed.
-- This causes partner/dashboard to loop approved partners back to the MOU
-- signing step even after they've completed it.
--
-- Fix 1: Backfill partners.mou_signed for existing approved partners who
--         signed via the new flow.
-- Fix 2: Add a trigger to keep them in sync going forward.

-- Step 1: Add mou_signed column to partners if it doesn't exist
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_signed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ;

-- Step 2: Backfill — mark mou_signed = true for any partner whose email
--         appears in barbershop_partner_applications with a mou_signed_at value
UPDATE public.partners p
SET
  mou_signed     = true,
  mou_signed_at  = bpa.mou_signed_at,
  updated_at     = now()
FROM public.barbershop_partner_applications bpa
WHERE bpa.contact_email = p.contact_email
  AND bpa.mou_signed_at IS NOT NULL
  AND bpa.status = 'approved'
  AND p.mou_signed = false;

-- Step 3: Trigger function — when barbershop_partner_applications.mou_signed_at
--         is set, sync to partners.mou_signed
CREATE OR REPLACE FUNCTION public.sync_bpa_mou_to_partners()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when mou_signed_at transitions from NULL to a value
  IF NEW.mou_signed_at IS NOT NULL AND (OLD.mou_signed_at IS NULL) THEN
    UPDATE public.partners
    SET
      mou_signed    = true,
      mou_signed_at = NEW.mou_signed_at,
      updated_at    = now()
    WHERE contact_email = NEW.contact_email;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 4: Attach trigger to barbershop_partner_applications
DROP TRIGGER IF EXISTS trg_sync_bpa_mou_to_partners
  ON public.barbershop_partner_applications;

CREATE TRIGGER trg_sync_bpa_mou_to_partners
  AFTER UPDATE ON public.barbershop_partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_bpa_mou_to_partners();

-- Step 5: Also sync onboarding_completed when the new flow finishes.
--         The new flow doesn't set partners.onboarding_completed — add a
--         trigger that sets it when all required fields are present.
CREATE OR REPLACE FUNCTION public.sync_bpa_onboarding_to_partners()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Consider onboarding complete when MOU is signed and employer acceptance is acknowledged
  IF NEW.mou_signed_at IS NOT NULL
     AND NEW.employer_acceptance_acknowledged = true
     AND (OLD.mou_signed_at IS NULL OR OLD.employer_acceptance_acknowledged IS DISTINCT FROM true)
  THEN
    UPDATE public.partners
    SET
      onboarding_completed = true,
      updated_at           = now()
    WHERE contact_email = NEW.contact_email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_bpa_onboarding_to_partners
  ON public.barbershop_partner_applications;

CREATE TRIGGER trg_sync_bpa_onboarding_to_partners
  AFTER UPDATE ON public.barbershop_partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_bpa_onboarding_to_partners();
