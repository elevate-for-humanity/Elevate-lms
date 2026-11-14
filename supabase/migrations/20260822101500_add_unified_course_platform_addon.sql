-- Canonical Store entitlement row for the unified Course Creation & Learning Platform.
-- Legacy LMS / Course Builder / AI Course Factory rows remain active only so
-- existing subscriptions can continue resolving during migration.

insert into public.saas_addon_catalog (
  code,
  name,
  monthly_price,
  feature_codes,
  active,
  sort_order
)
values (
  'course-creation-learning-platform',
  'Course Creation & Learning Platform',
  79.00,
  array['course_builder','course_factory','ai_content','lms','certificates']::text[],
  true,
  85
)
on conflict (code) do update
set
  name = excluded.name,
  monthly_price = excluded.monthly_price,
  feature_codes = excluded.feature_codes,
  active = true,
  sort_order = excluded.sort_order;
