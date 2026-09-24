-- Complete extension menu routing and add opt-in SMS missed-call alerts.
alter table public.notification_preferences
  add column if not exists sms_missed_calls boolean not null default false;

with system as (
  select id from public.phone_systems where tenant_id is null order by created_at limit 1
), workspace as (
  select w.id,w.phone_system_id from public.communication_workspaces w join system s on s.id=w.phone_system_id order by w.created_at limit 1
), routes as (
  select e.extension,e.destination_id,w.phone_system_id
  from public.communication_extensions e join workspace w on w.id=e.workspace_id
  where e.enabled=true and e.destination_id is not null
), desired(extension,digit,label) as (
  values
    ('100',0,'Administration'),
    ('101',1,'Technology Programs'),
    ('102',2,'HVAC Certification'),
    ('103',3,'Life Coach and Peer Support'),
    ('104',4,'Business and Bookkeeping'),
    ('105',5,'Beauty, Barber, and Cosmetology'),
    ('106',6,'CDL Training'),
    ('107',7,'Healthcare Programs')
)
insert into public.phone_menu_options(phone_system_id,digit,label,destination_id,position,enabled)
select r.phone_system_id,d.digit,d.label,r.destination_id,d.digit,true
from desired d join routes r on r.extension=d.extension
on conflict (phone_system_id,digit) do update
set label=excluded.label,destination_id=excluded.destination_id,position=excluded.position,enabled=true,updated_at=now();

-- The PWA/WebRTC extension is the primary route. External fallback is disabled
-- so PARIS handles unanswered/unavailable calls after extension routing.
update public.communication_extensions
set admin_external_fallback=false,
    external_fallback_number=null,
    updated_at=now()
where workspace_id in (select id from public.communication_workspaces where phone_system_id in (select id from public.phone_systems where tenant_id is null));
