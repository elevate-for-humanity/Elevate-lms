-- The server validates the scoped holder and exact approved agreement version.
-- Preserve the ordinary acceptance policies for every other document version.
create policy achieve_cna_signature_server_insert
  on public.license_agreement_acceptances as restrictive for insert to anon, authenticated
  with check (coalesce(document_version, '') not like 'achieve-cna-%');

create policy achieve_cna_signature_server_update
  on public.license_agreement_acceptances as restrictive for update to anon, authenticated
  using (coalesce(document_version, '') not like 'achieve-cna-%')
  with check (coalesce(document_version, '') not like 'achieve-cna-%');

create policy achieve_cna_signature_immutable_delete
  on public.license_agreement_acceptances as restrictive for delete to anon, authenticated
  using (coalesce(document_version, '') not like 'achieve-cna-%');
