alter table public.tax_clients add column if not exists source_system text;
alter table public.tax_clients add column if not exists source_client_id text;
alter table public.tax_clients add column if not exists display_name text;
alter table public.tax_clients add column if not exists client_type text;
alter table public.tax_clients add column if not exists import_metadata jsonb;
create unique index if not exists tax_clients_office_source_unique on public.tax_clients(office_id,source_system,source_client_id) where source_client_id is not null;
alter table public.tax_clients enable row level security;
revoke all on public.tax_clients from anon;
drop policy if exists drake_import_office_isolation on public.tax_clients;
create policy drake_import_office_isolation on public.tax_clients as restrictive for all to authenticated
using (source_system is distinct from 'drake' or exists(select 1 from public.tax_offices o where o.id=tax_clients.office_id and o.owner_id=(select auth.uid())))
with check (source_system is distinct from 'drake' or exists(select 1 from public.tax_offices o where o.id=tax_clients.office_id and o.owner_id=(select auth.uid())));
create or replace function public.guard_drake_client_binding() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.source_system='drake' and (new.office_id is distinct from old.office_id or new.source_system is distinct from old.source_system or new.source_client_id is distinct from old.source_client_id) then
 raise exception 'Imported client office/source identity cannot be reassigned'; end if; return new;
end $$;
revoke all on function public.guard_drake_client_binding() from public;
drop trigger if exists guard_drake_client_binding on public.tax_clients;
create trigger guard_drake_client_binding before update on public.tax_clients for each row execute function public.guard_drake_client_binding();
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000001','Start safely and select the right office','Supersonic software workflow · TY2026','Open the office workspace
Sign in with your assigned account, complete authenticator verification, and select your office. Confirm the client and tax year before opening records. Keep taxpayer data in the private workspace; do not send SSNs, bank numbers or identity documents through ordinary email or chat.

Separate practice from production
Practice cases are fictional and must never be transmitted to Drake, EPS or the IRS. Training completion is an internal record, not an IRS credential or permission to file. Report an unexpected client or office immediately; do not browse unrelated records.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,1) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000002','Client intake and document checks','Supersonic software workflow · TY2026','Identify the taxpayer and source documents
Match the client intake to identity documents in the approved private process. Check spelling, tax year, filing status, spouse and dependent details. A client directory entry is contact information; it is not a completed return. Never reconstruct a full SSN from the last four digits.

Resolve missing information
Use a document checklist for W-2s, 1099s, business records and relevant prior-year information. Confirm extracted W-2 fields against the original before calculation. Request clarification instead of guessing. Do not promise W-2 retrieval without an authorized supported retrieval method.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,2) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000003','Prepare and reconcile source data','Supersonic software workflow · TY2026','Use the taxpayer workspace
Start or open the correct TY2026 return. Enter taxpayer and dependent information, confirm income documents, and enter each Schedule C business separately with the correct owner. Save changes, then recalculate. A changed source document requires a new calculation and review.

Check calculations and unsupported items
Compare document totals to entered totals. Inspect diagnostics and resolve errors. Do not treat a preparation estimate as an IRS decision. Escalate unsupported forms, state calculations or complex issues to an authorized preparer in Drake. Use the official current-year instructions for tax-law decisions.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,3) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000004','Quality review and taxpayer authorization','Supersonic software workflow · TY2026','Complete an independent review
Compare intake and original documents with the prepared return, verify totals, owners, dependents, routing instructions and diagnostics. Record outstanding questions. A preparer should not silently approve their own unresolved exception.

Obtain the right signatures
Have the taxpayer review the actual return being authorized. Obtain spouse authorization when required. Use the applicable filing authorization and bank forms in their supported signing process. A training checkbox or an outdated signature is not permission to transmit a changed return.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,4) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000005','Fees, pay from refund and optional advances','Supersonic software workflow · TY2026','Present the full price
Show the selected service fee and each applicable bank or product charge before agreement. Offer pay upfront and an eligible pay-from-refund choice when operational. Compare the current refund estimate with all applicable fees; a sufficient estimate does not guarantee funding or approval.

Keep bank products distinct
A Refund Transfer collects authorized fees from refund proceeds; it is not a loan. An advance is an optional loan with its own terms and decision. Neither makes the IRS process a return faster. Use current EPS/Drake documents; do not replace them with practice disclosures. Office payouts must use Supersonic Fast Cash''s verified account, never Elevate''s account.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,5) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000006','Drake handoff and filing acknowledgments','Supersonic software workflow · TY2026','Prepare a controlled handoff
Reconcile the client identity, tax year, document checklist, prepared figures, review issues, selected fees and authorizations. Use only a documented supported Drake import or enter the information under preparer review. Record the Drake return reference after confirming the match. No automatic folder import has been verified.

Track the actual result
An export means the information was prepared for transfer, not filed. Record transmission and bank events from their actual source responses. Match acknowledgment references and tax year. For rejection, record the code, assign correction, update the return, obtain renewed authorization when needed, and track the resubmission separately.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,6) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000007','Office manager daily controls','Supersonic software workflow · TY2026','Manage the preparation queue
Review new clients, missing documents, unassigned work, preparation, independent review, signatures and handoff exceptions daily. Assign only authorized staff within the office. Confirm credential requirements and supervisor approval before production access; passing training alone does not grant access.

Reconcile daily reports
Compare office totals with Drake transmission acknowledgments and EPS funding reports. Keep prepared, sent, accepted, rejected and funded counts separate. Investigate missing references and stale items. Contact exports omit prior-year returns and documents, so mark those migration tasks separately.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,7) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;
insert into public.staff_training_modules(id,title,description,content,duration_minutes,category,required_for_roles,is_active,order_index) values ('66c02600-0000-4000-8000-000000000008','Central administration and multiple offices','Supersonic software workflow · TY2026','Establish each location
Create a separate office record and assign its owner, address and staff. Verify the location''s Drake licensing, EFIN and EPS requirements; never assume the main office''s credentials cover every site. Do not share passwords, signing identities or bank accounts across offices.

Monitor the network
Compare offices only within your authorized scope. Review client counts, work stages, training completion and unresolved provider exceptions. Use office filters and dated exports. Check permissions when someone changes roles or leaves. Keep a controlled record of enrollment, configuration changes and reviewer decisions.',20,'supersonic-2026',ARRAY['tax_preparer','office_manager','tax_administrator'],true,8) on conflict(id) do update set title=excluded.title,description=excluded.description,content=excluded.content,category=excluded.category,order_index=excluded.order_index;

drop policy if exists supersonic_training_private_read on public.staff_training_progress;
create policy supersonic_training_private_read on public.staff_training_progress as restrictive for select to authenticated using
(module_id not in (select id from public.staff_training_modules where category='supersonic-2026') or user_id=(select auth.uid()));
drop policy if exists supersonic_training_server_insert on public.staff_training_progress;
create policy supersonic_training_server_insert on public.staff_training_progress as restrictive for insert to authenticated with check
(module_id not in (select id from public.staff_training_modules where category='supersonic-2026'));
drop policy if exists supersonic_training_server_update on public.staff_training_progress;
create policy supersonic_training_server_update on public.staff_training_progress as restrictive for update to authenticated using
(module_id not in (select id from public.staff_training_modules where category='supersonic-2026')) with check
(module_id not in (select id from public.staff_training_modules where category='supersonic-2026'));

