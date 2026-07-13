-- RLS policies for hour_entries.
-- RLS is enabled; only service_role had access before this migration.
-- These policies allow authenticated users to interact via the browser Supabase client.

-- Apprentice can insert their own hours (user_id must match JWT)
CREATE POLICY authenticated_insert_own ON public.hour_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Apprentice can read their own hours
CREATE POLICY authenticated_select_own ON public.hour_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Employer/admin can update hours (approve/reject/lock)
-- Role verification happens at the API layer, not RLS.
CREATE POLICY authenticated_update_status ON public.hour_entries
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
