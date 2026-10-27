alter table public.ita_vouchers add column if not exists remittance_evidence jsonb not null default '[]'::jsonb;
comment on column public.ita_vouchers.remittance_evidence is 'Source-keyed remittance initiation evidence; does not confirm settlement or change payments_to_date.';
