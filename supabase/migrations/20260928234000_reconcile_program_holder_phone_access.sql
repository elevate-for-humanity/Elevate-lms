-- Reconcile dashboard phone access with current Program Holder lifecycle state.
-- Active/approved holders receive dashboard access to their assigned WebRTC
-- extension; the holder still chooses Ring/Vibrate/Silent in the PWA.
update public.communication_extensions ce
set enabled = true,
    updated_at = now()
from public.profiles p
join public.program_holders ph on ph.user_id = p.id
where ce.profile_id = p.id
  and lower(p.email) in (
    'operation@thecdlacademy.org',
    'info@enchantedheartstraining.com'
  )
  and ce.extension in ('106', '107')
  and ph.status in ('active', 'approved');

-- Inactive holders must not retain a callable dashboard extension.
update public.communication_extensions ce
set enabled = false,
    ring_mode = 'offline',
    presence_status = 'offline',
    updated_at = now()
from public.program_holders ph
where ph.user_id = ce.profile_id
  and ph.status = 'inactive';
