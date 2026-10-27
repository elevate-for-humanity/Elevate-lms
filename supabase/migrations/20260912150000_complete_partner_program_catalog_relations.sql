-- Complete public catalog relations for the approved Enchanted Hearts programs
-- and QMA. These are partner-managed offerings, not LMS-backed courses, so this
-- migration intentionally does not manufacture course modules or lessons.

with catalog_programs as (
  select
    id,
    slug,
    coalesce(title, name) as title,
    coalesce(description, short_description) as description,
    coalesce(price, tuition, total_cost) as catalog_price,
    case
      when slug in ('enchanted-hearts-cpr-certification', 'enchanted-hearts-cpr-instructor')
        then '/images/pages/programs-cpr-hero.webp'
      when slug in ('enchanted-hearts-cna-fast-track', 'enchanted-hearts-cna-qma-remediation')
        then '/images/pages/programs-cna-hero.webp'
      when slug = 'enchanted-hearts-skills-lab'
        then '/images/pages/healthcare-classroom.webp'
      when slug = 'enchanted-hearts-tb-validation'
        then '/images/pages/medical-assistant-lab.webp'
      else '/images/pages/pharmacy-tech.webp'
    end as image_url
  from public.programs
  where published = true
    and slug in (
      'enchanted-hearts-cna-qma-remediation',
      'enchanted-hearts-cna-fast-track',
      'enchanted-hearts-cpr-certification',
      'enchanted-hearts-cpr-instructor',
      'enchanted-hearts-qma-insulin',
      'qma',
      'enchanted-hearts-skills-lab',
      'enchanted-hearts-tb-validation'
    )
)
insert into public.program_media (program_id, media_type, url, alt_text, sort_order)
select id, 'hero_image', image_url, title || ' program', 1
from catalog_programs p
where not exists (select 1 from public.program_media m where m.program_id = p.id);

with catalog_programs as (
  select id, slug
  from public.programs
  where published = true
    and slug in (
      'enchanted-hearts-cna-qma-remediation', 'enchanted-hearts-cna-fast-track',
      'enchanted-hearts-cpr-certification', 'enchanted-hearts-cpr-instructor',
      'enchanted-hearts-qma-insulin', 'qma', 'enchanted-hearts-skills-lab',
      'enchanted-hearts-tb-validation'
    )
)
insert into public.program_ctas
  (program_id, cta_type, label, href, style_variant, is_external, sort_order)
select id, 'apply', 'Apply Now', '/apply?program=' || slug, 'primary', false, 1
from catalog_programs p
where not exists (select 1 from public.program_ctas c where c.program_id = p.id);

with catalog_programs as (
  select
    id,
    coalesce(description, short_description) as description,
    coalesce(price, tuition, total_cost) as catalog_price
  from public.programs
  where published = true
    and slug in (
      'enchanted-hearts-cna-qma-remediation', 'enchanted-hearts-cna-fast-track',
      'enchanted-hearts-cpr-certification', 'enchanted-hearts-cpr-instructor',
      'enchanted-hearts-qma-insulin', 'qma', 'enchanted-hearts-skills-lab',
      'enchanted-hearts-tb-validation'
    )
)
insert into public.program_tracks
  (program_id, track_code, title, description, funding_type, cost_cents, available, sort_order)
select
  id,
  'SELF_PAY',
  'Self-Pay',
  description,
  'self_pay',
  round(catalog_price * 100)::integer,
  true,
  1
from catalog_programs p
where catalog_price is not null
  and not exists (select 1 from public.program_tracks t where t.program_id = p.id);
