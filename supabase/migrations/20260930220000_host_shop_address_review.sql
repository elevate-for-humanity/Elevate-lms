alter table public.shops
  add column if not exists address_review_status text,
  add column if not exists address_review_note text,
  add column if not exists address_reviewed_at timestamptz,
  add column if not exists address_reviewed_by uuid;

alter table public.shops
  add constraint shops_address_review_status_check
  check (address_review_status is null or address_review_status in ('confirmed', 'correction_requested'));
