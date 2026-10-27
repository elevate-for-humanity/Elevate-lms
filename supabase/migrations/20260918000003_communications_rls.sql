-- Tenant isolation for authenticated communications users. Carrier webhooks and
-- privileged mutations run through audited server actions using service_role.

create or replace function public.current_communications_tenant_id()
returns uuid language sql stable security invoker set search_path = public as $$
  select coalesce(p.tenant_id, p.organization_id)
  from public.profiles p where p.id = auth.uid()
$$;
revoke all on function public.current_communications_tenant_id() from public;
grant execute on function public.current_communications_tenant_id() to authenticated, service_role;

create policy "tenant reads phone system" on public.phone_systems for select to authenticated
  using (tenant_id = public.current_communications_tenant_id());
create policy "tenant reads phone numbers" on public.phone_numbers for select to authenticated
  using (exists (select 1 from public.phone_systems s where s.id = phone_system_id and s.tenant_id = public.current_communications_tenant_id()));
create policy "tenant reads destinations" on public.phone_destinations for select to authenticated
  using (exists (select 1 from public.phone_systems s where s.id = phone_system_id and s.tenant_id = public.current_communications_tenant_id()));
create policy "tenant reads phone menu" on public.phone_menu_options for select to authenticated
  using (exists (select 1 from public.phone_systems s where s.id = phone_system_id and s.tenant_id = public.current_communications_tenant_id()));
create policy "tenant reads call history" on public.phone_calls for select to authenticated
  using (exists (select 1 from public.phone_systems s where s.id = phone_system_id and s.tenant_id = public.current_communications_tenant_id()));
create policy "tenant reads provider status" on public.phone_provider_connections for select to authenticated
  using (exists (select 1 from public.phone_systems s where s.id = phone_system_id and s.tenant_id = public.current_communications_tenant_id()));
create policy "tenant reads call events" on public.phone_call_events for select to authenticated
  using (exists (select 1 from public.phone_systems s where s.id = phone_system_id and s.tenant_id = public.current_communications_tenant_id()));

create policy "tenant reads communications workspace" on public.communication_workspaces for select to authenticated
  using (tenant_id = public.current_communications_tenant_id());
create policy "tenant reads extensions" on public.communication_extensions for select to authenticated
  using (exists (select 1 from public.communication_workspaces w where w.id = workspace_id and w.tenant_id = public.current_communications_tenant_id()));
create policy "tenant reads rooms" on public.communication_rooms for select to authenticated
  using (exists (select 1 from public.communication_workspaces w where w.id = workspace_id and w.tenant_id = public.current_communications_tenant_id()));
create policy "tenant reads participants" on public.communication_room_participants for select to authenticated
  using (exists (select 1 from public.communication_rooms r join public.communication_workspaces w on w.id = r.workspace_id where r.id = room_id and w.tenant_id = public.current_communications_tenant_id()));
create policy "tenant uses communication messages" on public.communication_messages for all to authenticated
  using (exists (select 1 from public.communication_workspaces w where w.id = workspace_id and w.tenant_id = public.current_communications_tenant_id()))
  with check (sender_profile_id = auth.uid() and exists (select 1 from public.communication_workspaces w where w.id = workspace_id and w.tenant_id = public.current_communications_tenant_id()));
create policy "user manages own communications onboarding" on public.communication_onboarding_progress for all to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.communication_workspaces w where w.id = workspace_id and w.tenant_id = public.current_communications_tenant_id()))
  with check (user_id = auth.uid() and exists (select 1 from public.communication_workspaces w where w.id = workspace_id and w.tenant_id = public.current_communications_tenant_id()));
