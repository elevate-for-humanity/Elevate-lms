-- Tenant Bootstrap Function
-- Single function to create tenant + owner + license in one transaction

CREATE OR REPLACE FUNCTION create_tenant_with_owner(
  tenant_name TEXT,
  tenant_slug TEXT,
  plan_name TEXT DEFAULT 'starter'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id UUID;
  seat_limit INTEGER;
  apprentice_limit INTEGER;
BEGIN
  -- Validate inputs
  IF tenant_name IS NULL OR tenant_slug IS NULL THEN
    RAISE EXCEPTION 'Tenant name and slug are required';
  END IF;

  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = tenant_slug) THEN
    RAISE EXCEPTION 'Tenant slug already exists: %', tenant_slug;
  END IF;

  -- Set limits based on plan
  CASE plan_name
    WHEN 'starter' THEN
      seat_limit := 5;
      apprentice_limit := 25;
    WHEN 'professional' THEN
      seat_limit := 25;
      apprentice_limit := 100;
    WHEN 'enterprise' THEN
      seat_limit := 999;
      apprentice_limit := 9999;
    ELSE
      RAISE EXCEPTION 'Invalid plan name: %', plan_name;
  END CASE;

  -- Create tenant
  INSERT INTO tenants (name, slug, created_at, updated_at)
  VALUES (tenant_name, tenant_slug, NOW(), NOW())
  RETURNING id INTO new_tenant_id;

  -- Add current user as owner
  INSERT INTO tenant_memberships (tenant_id, user_id, role, created_at)
  VALUES (new_tenant_id, auth.uid(), 'owner', NOW());

  -- Create license
  INSERT INTO tenant_licenses (
    tenant_id,
    plan,
    max_employers,
    max_apprentices,
    active,
    created_at,
    updated_at
  )
  VALUES (
    new_tenant_id,
    plan_name,
    seat_limit,
    apprentice_limit,
    true,
    NOW(),
    NOW()
  );

  -- Log the creation
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  )
  VALUES (
    new_tenant_id,
    auth.uid(),
    'create',
    'tenant',
    new_tenant_id,
    jsonb_build_object(
      'tenant_name', tenant_name,
      'plan', plan_name,
      'auto_created', true
    ),
    NOW()
  );

  RETURN new_tenant_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_tenant_with_owner(TEXT, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_tenant_with_owner IS 'Creates a new tenant with owner membership and license in a single transaction. Eliminates manual setup.';

-- Example usage:
-- SELECT create_tenant_with_owner('Acme Training', 'acme-training', 'professional');
