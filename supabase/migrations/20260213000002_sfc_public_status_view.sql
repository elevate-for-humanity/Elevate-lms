-- sfc_tax_return_public_status: public-safe view for tracking lookups.
-- ALL masking is done HERE in SQL, not in the API handler.
-- Only columns safe for unauthenticated callers are exposed.
--
-- SECURITY CONTRACT:
--   Any modification to this view requires security review.
--   Do NOT add: user_id, email, phone, notes, internal_status,
--   raw payload fields, document metadata, or internal IDs.

DROP VIEW IF EXISTS sfc_tax_return_public_status;

CREATE VIEW sfc_tax_return_public_status AS
SELECT
  tracking_id,

  -- Public-safe status (maps internal statuses to user-facing values)
  CASE status
    WHEN 'draft'             THEN 'received'
    WHEN 'pending_review'    THEN 'processing'
    WHEN 'generating_forms'  THEN 'processing'
    WHEN 'queued_for_efile'  THEN 'processing'
    WHEN 'transmitted'       THEN 'submitted'
    WHEN 'accepted'          THEN 'accepted'
    WHEN 'rejected'          THEN 'action_required'
    ELSE 'received'
  END AS status,

  -- NO efile_submission_id — internal pipeline identifier, not public
  -- NO raw last_error — sanitized rejection reason only
  CASE
    WHEN status = 'rejected' AND last_error ILIKE '%missing%document%'    THEN 'missing_documents'
    WHEN status = 'rejected' AND last_error ILIKE '%verification%'        THEN 'verification_failed'
    WHEN status = 'rejected' AND last_error ILIKE '%ssn%'                 THEN 'identity_mismatch'
    WHEN status = 'rejected' AND last_error ILIKE '%duplicate%'           THEN 'duplicate_filing'
    WHEN status = 'rejected' AND last_error IS NOT NULL                   THEN 'review_required'
    ELSE NULL
  END AS rejection_reason,

  created_at,
  updated_at,

  -- First name only (no full last name exposed)
  client_first_name,
  -- Last initial only — masking enforced in SQL, not application code
  LEFT(client_last_name, 1) AS client_last_initial

FROM sfc_tax_returns
WHERE tracking_id IS NOT NULL;

-- Revoke all, then grant SELECT to anon so the endpoint can use the anon key
-- instead of the service role key (defense in depth).
REVOKE ALL ON sfc_tax_return_public_status FROM anon, authenticated;
GRANT SELECT ON sfc_tax_return_public_status TO anon;
GRANT SELECT ON sfc_tax_return_public_status TO authenticated;

COMMENT ON VIEW sfc_tax_return_public_status IS
  'Public-safe view for refund tracking. '
  'Exposes: tracking_id, mapped status, sanitized rejection_reason, '
  'timestamps, first name, last initial only. '
  'Does NOT expose: efile_submission_id, user_id, email, phone, notes, '
  'raw last_error, internal statuses, document metadata, or payload fields. '
  'ANY modification requires security review.';
