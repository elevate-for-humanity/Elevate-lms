-- Profile identity synchronization runs through its existing database trigger.
-- Browser clients must not receive EXECUTE on this privileged implementation.
revoke execute on function public.sync_apprentice_identity_contract() from public, anon, authenticated;
grant execute on function public.sync_apprentice_identity_contract() to service_role;
