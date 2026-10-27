-- The public Host Shop directory is intentionally public marketing data.
-- SECURITY INVOKER keeps underlying RLS active; these grants expose only the
-- already-filtered view, not write access or privileged partner fields.

grant select on public.public_host_shops to anon, authenticated;
