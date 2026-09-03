-- Test Multi-Tenant Isolation
-- Run this in Supabase SQL Editor to verify tenant isolation works

-- 1. Create test tenants
INSERT INTO tenants (id, name, slug, domain, primary_color, secondary_color, active)
VALUES 
  ('test-tenant-1', 'Test Organization 1', 'test-org-1', 'test1.example.com', '#FF0000', '#00FF00', true),
  ('test-tenant-2', 'Test Organization 2', 'test-org-2', 'test2.example.com', '#0000FF', '#FFFF00', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  domain = EXCLUDED.domain;

-- 2. Create test licenses for each tenant
INSERT INTO licenses (tenant_id, plan, status, max_users, max_programs, max_students, features)
VALUES 
  ('test-tenant-1', 'professional', 'active', 50, 10, 100, '{"ai_features": true, "white_label": false, "custom_domain": false, "api_access": true, "advanced_reporting": true, "bulk_operations": true, "sso": false, "priority_support": true}'),
  ('test-tenant-2', 'enterprise', 'active', NULL, NULL, NULL, '{"ai_features": true, "white_label": true, "custom_domain": true, "api_access": true, "advanced_reporting": true, "bulk_operations": true, "sso": true, "priority_support": true}')
ON CONFLICT DO NOTHING;

-- 3. Create test users for each tenant
-- Note: These need to be created through Supabase Auth first, then linked here
-- This is a template - actual user IDs will be different

-- 4. Verify tenant isolation
-- Check that tenants are created
SELECT id, name, slug, domain, active FROM tenants WHERE id LIKE 'test-tenant-%';

-- Check that licenses are created
SELECT tenant_id, plan, status, max_users FROM licenses WHERE tenant_id LIKE 'test-tenant-%';

-- 5. Test RLS policies
-- Verify that profiles can only see their own tenant
-- (This requires actual user sessions to test properly)

-- 6. Test helper functions
SELECT is_license_valid('test-tenant-1');
SELECT is_license_valid('test-tenant-2');

SELECT is_feature_enabled('test-tenant-1', 'ai_features');
SELECT is_feature_enabled('test-tenant-1', 'white_label');
SELECT is_feature_enabled('test-tenant-2', 'white_label');

-- 7. Cleanup (optional - run this to remove test data)
-- DELETE FROM licenses WHERE tenant_id LIKE 'test-tenant-%';
-- DELETE FROM tenants WHERE id LIKE 'test-tenant-%';

-- Expected Results:
-- ✅ 2 tenants created
-- ✅ 2 licenses created
-- ✅ is_license_valid returns true for both
-- ✅ is_feature_enabled('test-tenant-1', 'white_label') returns false
-- ✅ is_feature_enabled('test-tenant-2', 'white_label') returns true
