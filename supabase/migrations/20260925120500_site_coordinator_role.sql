-- Add site_coordinator as a first-class portal role while preserving all existing roles.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (
    role = any (
      array[
        'super_admin','admin','org_admin','advisor','staff','instructor',
        'test_admin','proctor','student','learner','user','delegate','grant_client',
        'apprentice','barber_apprentice','cosmetology_apprentice',
        'sponsor','employer','recruiter','partner','host_shop','host_shop_admin',
        'workforce_partner','parent','creator','case_manager','workforce_board',
        'workforce_board_admin','program_holder','site_coordinator','provider',
        'provider_admin','mentor','guest'
      ]::text[]
    )
  );
