-- Add ServSafe and AHLEI hospitality programs to the programs table.
--
-- These are course+exam bundle programs sold through NRA (ServSafe) and
-- AHLEI (Guest Service Gold, START, ServSuccess) training partner agreements.
-- NRA/AHLEI handle exam delivery — this is not a proctored testing center offering.
--
-- Pricing comes from lib/testing/servsafe-pricing.ts at runtime.
-- total_cost = retail bundle price in dollars.
--
-- Apply in Supabase Dashboard → SQL Editor.

INSERT INTO public.programs (
  slug,
  title,
  description,
  category,
  duration_weeks,
  total_cost,
  published,
  is_active,
  status,
  funding_eligible,
  credential,
  short_description
) VALUES
  (
    'servsafe-food-handler',
    'ServSafe Food Handler',
    'Basic food safety training required for all food service workers. Fast, online, and nationally recognized. Covers personal hygiene, cross-contamination, time and temperature, and safe food handling.',
    'hospitality',
    1,
    29,
    true,
    true,
    'active',
    false,
    'ServSafe Food Handler Certificate',
    'Online food safety certification for food service workers. Complete in a few hours.'
  ),
  (
    'servsafe-manager',
    'ServSafe Manager',
    'Required certification for food service managers and supervisors. Covers HACCP, food safety law, manager responsibilities, health inspections, and employee training.',
    'hospitality',
    2,
    199,
    true,
    true,
    'active',
    false,
    'ServSafe Manager Certification',
    'Proctored food safety certification for managers. Nationally required in most states.'
  ),
  (
    'guest-service-gold',
    'Guest Service Gold',
    'Customer service excellence certification for hospitality and tourism workers. Covers customer interaction, service standards, and hospitality fundamentals.',
    'hospitality',
    1,
    89,
    true,
    true,
    'active',
    false,
    'Guest Service Gold Certificate (AHLEI)',
    'AHLEI customer service certification for hospitality workers.'
  ),
  (
    'start-hospitality',
    'START Hospitality Training',
    'Entry-level hospitality workforce training covering front desk, housekeeping, food and beverage, and more. Designed for workforce development programs.',
    'hospitality',
    2,
    89,
    true,
    true,
    'active',
    true,
    'START Certificate (AHLEI)',
    'Entry-level hospitality certification for workforce development.'
  ),
  (
    'servsuccess',
    'ServSuccess Restaurant Professional',
    'Career advancement certification for restaurant professionals. Five-course learning suite covering restaurant operations, plus a proctored certification exam.',
    'hospitality',
    4,
    129,
    true,
    true,
    'active',
    false,
    'ServSuccess Restaurant Professional Certificate (AHLEI)',
    'Five-course hospitality career advancement program with certification exam.'
  )
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  description       = EXCLUDED.description,
  total_cost        = EXCLUDED.total_cost,
  published         = EXCLUDED.published,
  is_active         = EXCLUDED.is_active,
  status            = EXCLUDED.status;
