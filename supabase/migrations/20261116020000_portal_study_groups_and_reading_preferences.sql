-- Learner Study Groups embeds member counts; PostgREST needs the relationship.
DELETE FROM public.study_group_members m
WHERE m.study_group_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.study_groups g WHERE g.id = m.study_group_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'study_group_members_study_group_id_fkey'
      AND conrelid = 'public.study_group_members'::regclass
  ) THEN
    ALTER TABLE public.study_group_members
      ADD CONSTRAINT study_group_members_study_group_id_fkey
      FOREIGN KEY (study_group_id) REFERENCES public.study_groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Learners read and save only their own narration speed preference.
ALTER TABLE public.accessibility_preferences ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.accessibility_preferences TO authenticated;
DROP POLICY IF EXISTS accessibility_preferences_own_select ON public.accessibility_preferences;
CREATE POLICY accessibility_preferences_own_select ON public.accessibility_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS accessibility_preferences_own_insert ON public.accessibility_preferences;
CREATE POLICY accessibility_preferences_own_insert ON public.accessibility_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS accessibility_preferences_own_update ON public.accessibility_preferences;
CREATE POLICY accessibility_preferences_own_update ON public.accessibility_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


NOTIFY pgrst, 'reload schema';
