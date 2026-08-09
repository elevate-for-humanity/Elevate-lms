-- Retired role cleanup: secure_identity remains readable by the authenticated
-- user for their own row and by the canonical admin policies. The legacy
-- super_admin role no longer exists in the application role model.
DROP POLICY IF EXISTS super_admin_read_secure_identity ON public.secure_identity;
