-- Extend portal_type CHECK constraint to include per-program apprenticeship values.
-- These map directly to /portal/[portal_type] routes.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_portal_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_portal_type_check CHECK (
    portal_type IN (
      -- existing category portals
      'apprentice',
      'healthcare',
      'technology',
      'business',
      'beauty',
      'trades',
      'social-services',
      -- per-program apprenticeship portals
      'barber',
      'cosmetology',
      'esthetician',
      'nail-technician',
      'culinary',
      'electrical',
      'plumbing'
    )
  );
