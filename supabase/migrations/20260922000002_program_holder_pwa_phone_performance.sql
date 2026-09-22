-- Cover the phone-routing foreign keys used by webhook and inbox lookups.
create index if not exists communication_extensions_destination_idx
  on public.communication_extensions(destination_id);
create index if not exists communication_extensions_profile_idx
  on public.communication_extensions(profile_id);
create index if not exists phone_destinations_extension_idx
  on public.phone_destinations(extension_id);
create index if not exists phone_call_legs_extension_idx
  on public.phone_call_legs(extension_id);
create index if not exists phone_call_legs_profile_idx
  on public.phone_call_legs(profile_id);
create index if not exists phone_callback_tasks_extension_idx
  on public.phone_callback_tasks(extension_id);
create index if not exists phone_calls_assigned_extension_idx
  on public.phone_calls(assigned_extension_id);
create index if not exists phone_calls_destination_idx
  on public.phone_calls(destination_id);
create index if not exists phone_calls_phone_number_idx
  on public.phone_calls(phone_number_id);
create index if not exists voicemails_assigned_profile_idx
  on public.voicemails(assigned_profile_id);
create index if not exists voicemails_extension_idx
  on public.voicemails(extension_id);
create index if not exists voicemails_call_idx
  on public.voicemails(call_id);
create index if not exists voicemails_phone_system_idx
  on public.voicemails(phone_system_id);
create index if not exists program_holder_meetings_created_by_idx
  on public.program_holder_meetings(created_by);
create index if not exists program_holder_meetings_enrollment_idx
  on public.program_holder_meetings(enrollment_id);
create index if not exists program_holder_meetings_student_idx
  on public.program_holder_meetings(program_holder_student_id);

-- Evaluate the authenticated user once per statement instead of once per row.
drop policy if exists "user reads own phone devices" on public.phone_webrtc_devices;
create policy "user reads own phone devices" on public.phone_webrtc_devices
  for select to authenticated using (profile_id = (select auth.uid()));

drop policy if exists "user removes own phone devices" on public.phone_webrtc_devices;
create policy "user removes own phone devices" on public.phone_webrtc_devices
  for delete to authenticated using (profile_id = (select auth.uid()));

drop policy if exists "user reads own phone call legs" on public.phone_call_legs;
create policy "user reads own phone call legs" on public.phone_call_legs
  for select to authenticated using (profile_id = (select auth.uid()));

drop policy if exists "user reads own phone callback tasks" on public.phone_callback_tasks;
create policy "user reads own phone callback tasks" on public.phone_callback_tasks
  for select to authenticated using (assigned_profile_id = (select auth.uid()));

drop policy if exists "user updates own phone callback tasks" on public.phone_callback_tasks;
create policy "user updates own phone callback tasks" on public.phone_callback_tasks
  for update to authenticated
  using (assigned_profile_id = (select auth.uid()))
  with check (assigned_profile_id = (select auth.uid()));

drop policy if exists "users read assigned voicemails" on public.voicemails;
create policy "users read assigned voicemails" on public.voicemails
  for select to authenticated
  using (
    assigned_profile_id = (select auth.uid())
    or user_id = (select auth.uid())
  );

drop policy if exists "users update assigned voicemails" on public.voicemails;
create policy "users update assigned voicemails" on public.voicemails
  for update to authenticated
  using (
    assigned_profile_id = (select auth.uid())
    or user_id = (select auth.uid())
  )
  with check (
    assigned_profile_id = (select auth.uid())
    or user_id = (select auth.uid())
  );
