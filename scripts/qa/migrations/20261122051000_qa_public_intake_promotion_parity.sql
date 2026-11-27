-- Isolated Supabase QA ONLY: elevate-lms-qa (isdgjcdabhxxozarmxta).
-- Restores missing canonical public-intake workflow structures; no production
-- use, no customer rows, credentials, application approvals, or payment writes.
-- Root failure: PGRST205 public.application_intake and destination tables absent.
-- Canonical source: 20260216900000_application_intake.sql,
-- 20260811214500_promote_public_application_intake.sql, production catalog.
-- A fail-closed guard makes this un-runnable against populated production.

DO $qa_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relname IN ('application_intake','employer_applications',
                      'staff_applications','program_holder_applications')
  ) THEN
    RAISE EXCEPTION 'Intake QA bootstrap refused: destination objects already exist';
  END IF;
  IF to_regclass('public.profiles') IS NULL
     OR to_regclass('public.program_holder_documents') IS NULL
     OR to_regprocedure('rpc_private.is_admin()') IS NULL
  THEN
    RAISE EXCEPTION 'Intake QA bootstrap refused: isolated role/review prerequisites missing';
  END IF;
END
$qa_guard$;

-- Review tables retain the canonical production columns and status constraint.
CREATE TABLE public.employer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_name text NOT NULL, contact_name text NOT NULL, email text NOT NULL,
  phone text, status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','in_review')),
  data jsonb DEFAULT '{}'::jsonb, intake jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text DEFAULT 'submitted', state_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX qa_employer_applications_email_idx ON public.employer_applications(email);
CREATE INDEX qa_employer_applications_tenant_status_idx ON public.employer_applications(tenant_id,status);

CREATE TABLE public.staff_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL, email text NOT NULL, phone text, position text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','in_review')),
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX qa_staff_applications_email_idx ON public.staff_applications(email);

CREATE TABLE public.program_holder_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_name text NOT NULL, contact_name text NOT NULL, email text NOT NULL,
  phone text, status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','in_review')),
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX qa_program_holder_applications_email_idx ON public.program_holder_applications(email);
CREATE INDEX qa_program_holder_applications_tenant_status_idx ON public.program_holder_applications(tenant_id,status);

CREATE TABLE public.application_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  application_type text NOT NULL, program_id uuid,
  payload jsonb NOT NULL, resolved_tenant_id uuid,
  status text NOT NULL DEFAULT 'received', processed_at timestamptz, error text,
  ip_address inet, user_agent text, source text NOT NULL DEFAULT 'public_form',
  destination_table text, destination_id uuid
);
CREATE INDEX qa_intake_type_idx ON public.application_intake(application_type);
CREATE INDEX qa_intake_status_idx ON public.application_intake(status);
CREATE INDEX qa_intake_created_idx ON public.application_intake(created_at DESC);
CREATE INDEX qa_intake_program_idx ON public.application_intake(program_id);
CREATE INDEX qa_intake_ip_created_idx ON public.application_intake(ip_address,created_at DESC);

-- No anonymous access and no cross-tenant public review. Only authorized
-- service-role APIs may write; authenticated administrators can read review rows.
ALTER TABLE public.application_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.application_intake, public.employer_applications,
  public.staff_applications, public.program_holder_applications FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.application_intake, public.employer_applications,
  public.staff_applications, public.program_holder_applications TO service_role;
GRANT SELECT ON public.application_intake, public.employer_applications,
  public.staff_applications, public.program_holder_applications TO authenticated;

CREATE POLICY qa_intake_admin_read ON public.application_intake
  FOR SELECT TO authenticated USING ((SELECT rpc_private.is_admin()));
CREATE POLICY qa_employer_admin_read ON public.employer_applications
  FOR SELECT TO authenticated USING ((SELECT rpc_private.is_admin()));
CREATE POLICY qa_staff_admin_read ON public.staff_applications
  FOR SELECT TO authenticated USING ((SELECT rpc_private.is_admin()));
CREATE POLICY qa_holder_admin_read ON public.program_holder_applications
  FOR SELECT TO authenticated USING ((SELECT rpc_private.is_admin()));

-- Canonical same-transaction promotion. Security-definer scope is executable
-- by service_role only; it never exposes raw submitted personal data publicly.
CREATE FUNCTION public.promote_public_application_intake_v1()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $promote$
DECLARE v_destination_id uuid;
BEGIN
  IF new.status <> 'received' THEN RETURN new; END IF;
  IF new.application_type = 'employer' THEN
    INSERT INTO public.employer_applications
      (tenant_id,company_name,contact_name,email,phone,status,data,intake,state)
    VALUES (
      new.resolved_tenant_id,
      nullif(trim(new.payload->>'company_name'),''),
      nullif(trim(new.payload->>'contact_name'),''),
      lower(nullif(trim(new.payload->>'email'),'')),
      nullif(trim(new.payload->>'phone'),''),
      'pending',new.payload,new.payload,'submitted')
    RETURNING id INTO v_destination_id;
    UPDATE public.application_intake
    SET status='processed',processed_at=now(),
        destination_table='employer_applications',destination_id=v_destination_id,error=null
    WHERE id=new.id;
  ELSIF new.application_type = 'staff' THEN
    INSERT INTO public.staff_applications
      (tenant_id,full_name,email,phone,position,status,data)
    VALUES (
      new.resolved_tenant_id,
      coalesce(nullif(trim(new.payload->>'full_name'),''),
               trim(concat_ws(' ',new.payload->>'first_name',new.payload->>'last_name'))),
      lower(nullif(trim(new.payload->>'email'),'')),
      nullif(trim(new.payload->>'phone'),''),
      nullif(trim(new.payload->>'position'),''),
      'pending',new.payload)
    RETURNING id INTO v_destination_id;
    UPDATE public.application_intake
    SET status='processed',processed_at=now(),
        destination_table='staff_applications',destination_id=v_destination_id,error=null
    WHERE id=new.id;
  ELSIF new.application_type = 'program_holder' THEN
    INSERT INTO public.program_holder_applications
      (tenant_id,organization_name,contact_name,email,phone,status,data)
    VALUES (
      new.resolved_tenant_id,
      nullif(trim(new.payload->>'organization_name'),''),
      nullif(trim(new.payload->>'contact_name'),''),
      lower(nullif(trim(new.payload->>'email'),'')),
      nullif(trim(new.payload->>'phone'),''),
      'pending',new.payload)
    RETURNING id INTO v_destination_id;
    UPDATE public.application_intake
    SET status='processed',processed_at=now(),
        destination_table='program_holder_applications',destination_id=v_destination_id,error=null
    WHERE id=new.id;
  END IF;
  RETURN new;
END
$promote$;
REVOKE ALL ON FUNCTION public.promote_public_application_intake_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_public_application_intake_v1() TO service_role;
CREATE TRIGGER trg_promote_public_application_intake_v1
AFTER INSERT ON public.application_intake
FOR EACH ROW WHEN (new.status = 'received')
EXECUTE FUNCTION public.promote_public_application_intake_v1();

-- No real identities or requests are seeded. Check whole schema and privileges.
DO $verify$
DECLARE v_table text; v_count bigint;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['application_intake','employer_applications',
      'staff_applications','program_holder_applications']
  LOOP
    IF NOT EXISTS(
      SELECT 1 FROM pg_class
      WHERE oid=to_regclass('public.'||v_table) AND relrowsecurity
    ) THEN RAISE EXCEPTION 'QA RLS missing on %', v_table; END IF;
    IF EXISTS(
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema='public' AND table_name=v_table AND grantee='anon'
    ) THEN RAISE EXCEPTION 'QA anonymous grant forbidden on %', v_table; END IF;
    EXECUTE format('SELECT count(*) FROM public.%I',v_table) INTO STRICT v_count;
    IF v_count <> 0 THEN RAISE EXCEPTION 'Unexpected data in new QA table %',v_table; END IF;
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.application_intake'::regclass
      AND tgname='trg_promote_public_application_intake_v1' AND tgenabled='O'
  ) THEN RAISE EXCEPTION 'QA promotion trigger absent'; END IF;
END
$verify$;
NOTIFY pgrst, 'reload schema';
