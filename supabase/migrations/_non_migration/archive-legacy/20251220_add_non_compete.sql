-- Add Non-Compete Agreement to Required Documents
-- Protects EFH curriculum, apprentices, and IP

-- Add non-compete to required docs
INSERT INTO shop_document_requirements (
  program_slug,
  state,
  document_type,
  required,
  display_name,
  description
)
VALUES (
  'barber-apprenticeship',
  'IN',
  'non_compete',
  true,
  'Signed Non-Compete Agreement',
  'Restricts use of EFH curriculum, apprentices, and IP outside approved scope'
)
ON CONFLICT (program_slug, state, document_type) DO NOTHING;

-- Update signature tracking to include IP acknowledgment flag
ALTER TABLE shop_signatures
ADD COLUMN IF NOT EXISTS ip_acknowledged BOOLEAN NOT NULL DEFAULT false;

-- Comment
COMMENT ON COLUMN shop_signatures.ip_acknowledged IS 'Confirms shop acknowledges EFH IP ownership and restrictions';
