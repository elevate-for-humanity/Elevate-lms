-- These NHA pathways are intentionally sold as individual preparation and
-- exam items, not as a single tuition bundle. Label them as self-pay without
-- inventing a bundled tuition amount.
update public.programs
set funding_tags = array['Self-Pay','A-La-Carte']::text[],
    funding = 'Self-pay, a-la-carte NHA preparation and exam items. Confirm the selected items and current total with Admissions before quoting or collecting payment.',
    is_free = false,
    updated_at = now()
where slug in ('nha-ekg-technician','nha-ehr','nha-billing-coding');
