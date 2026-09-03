-- Fix: documents table has no owner SELECT policy.
-- Students can upload documents but cannot read them back.
--
-- The documents table has both owner_id (original) and user_id (added by
-- 20260128_update_documents_table.sql). The upload page uses user_id.
-- We add policies for both columns.

BEGIN;

-- 1. Students can view their own documents (by user_id)
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Students can view documents where they are the owner (by owner_id)
DROP POLICY IF EXISTS "Owners can view own documents" ON public.documents;
CREATE POLICY "Owners can view own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- 3. Students can update their own documents (e.g. re-upload)
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Admin full access (uses is_admin() to avoid recursion)
DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
CREATE POLICY "documents_admin_all"
  ON public.documents
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 5. Grant SELECT to authenticated (was missing)
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;

COMMIT;
