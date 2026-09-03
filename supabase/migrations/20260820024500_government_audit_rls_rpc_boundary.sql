-- Government audit hardening: least-privilege RLS and privileged RPC boundary.

REVOKE ALL ON FUNCTION public.audit_participant_funding_authorization() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_participant_funding_authorization() TO service_role;

REVOKE ALL ON FUNCTION public.enforce_profile_funding_confirmation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_profile_funding_confirmation() TO service_role;

ALTER FUNCTION public.verify_certificate_integrity(text) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.verify_certificate_integrity(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate_integrity(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS participant_funding_authorization_audit_read ON public.participant_funding_authorization_audit;
CREATE POLICY participant_funding_authorization_audit_read
ON public.participant_funding_authorization_audit
FOR SELECT TO authenticated
USING (participant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS participant_funding_authorization_audit_service ON public.participant_funding_authorization_audit;
CREATE POLICY participant_funding_authorization_audit_service
ON public.participant_funding_authorization_audit
FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS program_regulatory_status_public_read ON public.program_regulatory_status;
CREATE POLICY program_regulatory_status_public_read
ON public.program_regulatory_status
FOR SELECT TO anon, authenticated
USING (public_claim_allowed = true);

DROP POLICY IF EXISTS program_regulatory_status_admin_manage ON public.program_regulatory_status;
CREATE POLICY program_regulatory_status_admin_manage
ON public.program_regulatory_status
FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS program_regulatory_status_service ON public.program_regulatory_status;
CREATE POLICY program_regulatory_status_service
ON public.program_regulatory_status
FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS program_claim_evidence_admin_manage ON public.program_claim_evidence;
CREATE POLICY program_claim_evidence_admin_manage
ON public.program_claim_evidence
FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS program_claim_evidence_service ON public.program_claim_evidence;
CREATE POLICY program_claim_evidence_service
ON public.program_claim_evidence
FOR ALL TO service_role
USING (true) WITH CHECK (true);

ALTER VIEW public.public_program_compliance SET (security_invoker = true);

COMMENT ON TABLE public.participant_funding_authorization_audit IS 'Immutable participant funding authorization audit. Participant/admin read; trigger/service maintenance.';
COMMENT ON TABLE public.program_regulatory_status IS 'Authoritative program regulatory status. Public reads limited to public_claim_allowed rows; privileged maintenance only.';
COMMENT ON TABLE public.program_claim_evidence IS 'Material claim evidence ledger. Privileged maintenance/read only; public claims are exposed through curated compliance projections.';