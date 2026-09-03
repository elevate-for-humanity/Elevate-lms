-- Keep the production profiles.role constraint aligned with the canonical RBAC registry.
-- org_admin and other canonical roles are used by portal and trial provisioning flows.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (
    role = ANY (ARRAY[
      'super_admin','admin','org_admin','advisor','staff','instructor','test_admin','proctor',
      'student','learner','user','delegate','grant_client','apprentice','barber_apprentice',
      'cosmetology_apprentice','sponsor','employer','recruiter','partner','host_shop','host_shop_admin',
      'workforce_partner','parent','creator','case_manager','workforce_board','workforce_board_admin',
      'program_holder','provider','provider_admin','mentor','guest'
    ]::text[])
  );
