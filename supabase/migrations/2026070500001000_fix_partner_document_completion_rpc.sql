-- Fix check_partner_document_completion RPC.
-- Previous version referenced revoked_at column which does not exist on partner_program_access.
-- Simplified: returns true when all required document types for the partner have an accepted record.

CREATE OR REPLACE FUNCTION public.check_partner_document_completion(p_partner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_required_count int;
  v_accepted_count int;
BEGIN
  -- Count required document types for this partner
  SELECT COUNT(DISTINCT document_type)
  INTO v_required_count
  FROM public.partner_document_requirements
  WHERE is_required = true;

  IF v_required_count = 0 THEN
    RETURN true;
  END IF;

  -- Count accepted documents of required types
  SELECT COUNT(DISTINCT document_type)
  INTO v_accepted_count
  FROM public.partner_documents
  WHERE partner_id = p_partner_id
    AND status = 'accepted'
    AND document_type IN (
      SELECT document_type FROM public.partner_document_requirements WHERE is_required = true
    );

  RETURN v_accepted_count >= v_required_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_partner_document_completion(uuid) TO authenticated, service_role;
