-- Harden the first audited set of sensitive tables.
-- This migration is intentionally narrow: it removes only globally-readable
-- authenticated policies whose access paths were individually reviewed.

DROP POLICY IF EXISTS "auth_read_bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "auth_read_application_submissions" ON public.application_submissions;
DROP POLICY IF EXISTS "auth_read_apprenticeship_intake" ON public.apprenticeship_intake;
DROP POLICY IF EXISTS "auth_read_affiliate_payouts" ON public.affiliate_payouts;

-- Affiliates may read only payout rows explicitly linked to their auth user.
-- Existing admin and privileged-session policies remain unchanged.
CREATE POLICY "affiliate_payouts_select_own"
ON public.affiliate_payouts
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));
