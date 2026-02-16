-- Migration: Extend prevent_tenant_id_change trigger to all core tables
-- Problem: Only profiles has the immutability trigger. Other core tables
--          allow tenant_id to be changed via UPDATE, enabling tenant
--          reassignment attacks.
-- Fix: Add the same trigger to all 6 remaining core skeleton tables.

DROP TRIGGER IF EXISTS protect_tenant_id ON training_enrollments;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON certificates;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON lesson_progress;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON apprentice_placements;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON apprentice_placements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON shops;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON shop_staff;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON shop_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();
