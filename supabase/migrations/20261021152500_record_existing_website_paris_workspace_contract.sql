-- Capture the existing production workspace contract in migration history.
-- Do not seed, enable, or change any customer workspace or public instructions.
CREATE TABLE IF NOT EXISTS public.website_paris_workspaces (
  website_id uuid PRIMARY KEY REFERENCES public.user_websites(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  welcome_message text NOT NULL DEFAULT 'Hello, I am PARIS. How can I help you with this business?' CHECK (length(welcome_message) <= 500),
  public_instructions text NOT NULL DEFAULT '' CHECK (length(public_instructions) <= 2400),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_paris_workspaces ENABLE ROW LEVEL SECURITY;

-- Existing installations retain their policy; fresh installations get the
-- same owner / active organization manager SELECT boundary observed in production.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'website_paris_workspaces'
      AND policyname = 'paris_business_managers_read'
  ) THEN
    CREATE POLICY paris_business_managers_read
      ON public.website_paris_workspaces FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.user_websites w
        WHERE w.id = website_paris_workspaces.website_id
          AND (w.user_id = (SELECT auth.uid()) OR EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.organization_id = w.organization_id
              AND ou.user_id = (SELECT auth.uid())
              AND ou.status = 'active'
              AND ou.role IN ('org_owner', 'org_admin')
          ))
      ));
  END IF;
END $$;
