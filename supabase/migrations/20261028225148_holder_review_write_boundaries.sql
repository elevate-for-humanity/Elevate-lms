-- Browser sessions must not approve their own documents or replace protected file references.
-- Canonical holder uploads use the authenticated server route and service-role client.
-- Preserve the table's existing administrator predicate and all SELECT/MFA policies.
drop policy if exists holder_document_insert_review_boundary on public.program_holder_documents;
create policy holder_document_insert_review_boundary on public.program_holder_documents
  as restrictive for insert to authenticated
  with check ((select rpc_private.is_admin()));

drop policy if exists holder_document_update_review_boundary on public.program_holder_documents;
create policy holder_document_update_review_boundary on public.program_holder_documents
  as restrictive for update to authenticated
  using ((select rpc_private.is_admin()))
  with check ((select rpc_private.is_admin()));

drop policy if exists holder_document_delete_review_boundary on public.program_holder_documents;
create policy holder_document_delete_review_boundary on public.program_holder_documents
  as restrictive for delete to authenticated
  using ((select rpc_private.is_admin()));

-- Do not let a direct Data API insert impersonate a route-validated exit report or invoice draft.
-- Other existing report types keep their existing ownership policies.
drop policy if exists holder_testing_report_insert_boundary on public.program_holder_reports;
create policy holder_testing_report_insert_boundary on public.program_holder_reports
  as restrictive for insert to authenticated
  with check (
    coalesce(metadata->>'report_kind', '') <> 'testing_readiness'
    or (select rpc_private.is_admin())
  );
