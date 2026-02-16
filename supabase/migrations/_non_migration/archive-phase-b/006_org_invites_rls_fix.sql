-- Fix org_invites RLS security leak
-- Remove global SELECT policy and replace with token-bound access

-- Drop the insecure policy
DROP POLICY IF EXISTS "anyone_can_view_own_invite" ON org_invites;

-- Create secure function to get invite by token
CREATE OR REPLACE FUNCTION get_invite_by_token(invite_token UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  organization_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  organization_name TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only return invite if token matches and not expired
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.role,
    i.organization_id,
    i.created_by,
    i.created_at,
    i.expires_at,
    i.accepted_at,
    o.name as organization_name
  FROM org_invites i
  JOIN organizations o ON o.id = i.organization_id
  WHERE i.token = invite_token
    AND i.expires_at > NOW()
    AND i.accepted_at IS NULL;
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION get_invite_by_token(UUID) TO authenticated;

-- Org admins can view invites for their org
CREATE POLICY "org_admins_view_org_invites"
  ON org_invites
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
        AND role IN ('org_admin', 'super_admin')
    )
  );

-- Comment for clarity
COMMENT ON FUNCTION get_invite_by_token IS 'Securely retrieves invite details by token without exposing all invites';
