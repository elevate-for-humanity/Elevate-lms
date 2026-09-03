create unique index if not exists shop_supervisors_shop_user_unique
on public.shop_supervisors(shop_id,user_id);

insert into public.shop_supervisors(shop_id,user_id,name,email,is_active,created_at,updated_at)
select distinct ap.shop_id, ap.supervisor_user_id, p.full_name, p.email, true, now(), now()
from public.apprentice_placements ap
join public.profiles p on p.id=ap.supervisor_user_id
where ap.status='active'
  and ap.supervisor_user_id is not null
  and ap.shop_id is not null
  and not exists (
    select 1 from public.shop_supervisors ss
    where ss.shop_id=ap.shop_id and ss.user_id=ap.supervisor_user_id
  );
