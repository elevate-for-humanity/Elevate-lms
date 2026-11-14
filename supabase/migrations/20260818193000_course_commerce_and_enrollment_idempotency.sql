create table if not exists public.course_commerce (
  course_id uuid primary key references public.courses(id) on delete cascade,
  currency text not null default 'usd',
  exam_voucher_cost_cents integer not null default 0,
  delivery_cost_cents integer not null default 0,
  processing_reserve_cents integer not null default 0,
  retail_price_cents integer not null,
  gross_margin_cents integer generated always as (
    retail_price_cents - exam_voucher_cost_cents - delivery_cost_cents - processing_reserve_cents
  ) stored,
  exam_voucher_included boolean not null default true,
  self_pay_enabled boolean not null default false,
  bnpl_enabled boolean not null default true,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_commerce_currency_check check (currency ~ '^[a-z]{3}$'),
  constraint course_commerce_exam_cost_check check (exam_voucher_cost_cents >= 0),
  constraint course_commerce_delivery_cost_check check (delivery_cost_cents >= 0),
  constraint course_commerce_processing_reserve_check check (processing_reserve_cents >= 0),
  constraint course_commerce_retail_price_check check (retail_price_cents > 0),
  constraint course_commerce_positive_margin_check check (
    retail_price_cents > exam_voucher_cost_cents + delivery_cost_cents + processing_reserve_cents
  )
);

alter table public.course_commerce enable row level security;

drop policy if exists course_commerce_admin_all on public.course_commerce;
create policy course_commerce_admin_all
  on public.course_commerce
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.course_enrollments'::regclass
      and conname = 'course_enrollments_student_course_key'
  ) then
    alter table public.course_enrollments
      add constraint course_enrollments_student_course_key unique (student_id, course_id);
  end if;
end
$$;

with pricing(slug, exam_cost_cents, retail_price_cents, delivery_cost_cents) as (
  values
    ('cert-prep-adobe-express', 15000, 149500, 30000),
    ('cert-prep-adobe-premiere-pro', 15000, 149500, 30000),
    ('cert-prep-adobe-acrobat-pro', 15000, 149500, 30000),
    ('cert-prep-adobe-illustrator', 15000, 149500, 30000),
    ('cert-prep-adobe-animate', 15000, 149500, 30000),
    ('cert-prep-adobe-indesign', 15000, 149500, 30000),
    ('cert-prep-adobe-firefly', 15000, 149500, 30000),
    ('cert-prep-adobe-photoshop', 15000, 149500, 30000),
    ('cert-prep-adobe-after-effects', 15000, 149500, 30000),
    ('cert-prep-adobe-dreamweaver', 15000, 149500, 30000),
    ('cert-prep-agriscience-foundations', 9000, 99700, 25000),
    ('cert-prep-generative-ai-foundations', 8500, 99700, 25000),
    ('cert-prep-professional-communication', 8500, 99700, 25000),
    ('cert-prep-medical-administrative-assistant', 9000, 99700, 25000),
    ('cert-prep-culinary-foundations', 9000, 99700, 25000),
    ('cert-prep-ic3-gs5-computing-fundamentals', 7900, 99700, 25000),
    ('cert-prep-ic3-gs5-key-applications', 7900, 99700, 25000),
    ('cert-prep-ic3-gs5-living-online', 7900, 99700, 25000),
    ('cert-prep-ic3-gs6-level-1', 7900, 99700, 25000),
    ('cert-prep-ic3-gs6-level-2', 7900, 99700, 25000),
    ('cert-prep-ic3-gs6-level-3', 7900, 99700, 25000),
    ('cert-prep-pmi-project-management-ready', 12500, 129500, 30000),
    ('cert-prep-unity-artist', 13000, 129500, 30000),
    ('cert-prep-unity-programmer', 13000, 129500, 30000),
    ('cert-prep-unity-vr-developer', 13000, 129500, 30000),
    ('entrepreneurship', 9000, 99700, 25000)
)
insert into public.course_commerce (
  course_id,
  exam_voucher_cost_cents,
  delivery_cost_cents,
  processing_reserve_cents,
  retail_price_cents,
  exam_voucher_included,
  self_pay_enabled,
  bnpl_enabled
)
select
  c.id,
  p.exam_cost_cents,
  p.delivery_cost_cents,
  ceil(p.retail_price_cents * 0.03)::integer + 30,
  p.retail_price_cents,
  true,
  false,
  true
from pricing p
join public.courses c on c.slug = p.slug
on conflict (course_id) do update
set exam_voucher_cost_cents = excluded.exam_voucher_cost_cents,
    delivery_cost_cents = excluded.delivery_cost_cents,
    processing_reserve_cents = excluded.processing_reserve_cents,
    retail_price_cents = excluded.retail_price_cents,
    exam_voucher_included = excluded.exam_voucher_included,
    self_pay_enabled = false,
    bnpl_enabled = excluded.bnpl_enabled,
    updated_at = now();

comment on table public.course_commerce is
  'Private pricing authority for self-pay courses. Retail prices include the configured exam voucher cost; self-pay remains disabled until course approval.';
