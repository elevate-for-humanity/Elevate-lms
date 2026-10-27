create or replace function public.admin_traffic_summary(p_start timestamptz)
returns jsonb language sql stable security invoker set search_path = public
as $$
with views as materialized (
 select coalesce(nullif(path,''),nullif(page,''),'unknown') as path, nullif(session_id,'') as session_id,
 coalesce(nullif(utm_source,''), case when referrer ~ '^https?://' then lower(split_part(split_part(referrer,'://',2),'/',1)) when referrer like 'android-app://%' then split_part(split_part(referrer,'://',2),'/',1) else 'direct / unknown' end) as source,
 case when referrer ~ '^https?://' then split_part(split_part(referrer,'://',2),'/',1) when referrer like 'android-app://%' then split_part(split_part(referrer,'://',2),'/',1) else null end as referrer,
 to_char(created_at at time zone 'America/New_York','YYYY-MM-DD') as day
 from public.page_views where created_at >= greatest(p_start,now()-interval '90 days') and created_at <= now()
), pages as (select path as label,count(*) as value from views group by path order by value desc,label limit 15),
 sources as (select source as label,count(*) as value from views group by source order by value desc,label limit 10),
 refs as (select referrer as label,count(*) as value from views where referrer is not null group by referrer order by value desc,label limit 10),
 days as (select day as label,count(*) as value from views group by day order by day)
select jsonb_build_object('views',(select count(*) from views),'sessions',(select count(distinct session_id) from views),
'pages',(select count(distinct path) from views),'sources',(select count(distinct source) from views),
'topPages',coalesce((select jsonb_agg(to_jsonb(pages)) from pages),'[]'::jsonb),
'topSources',coalesce((select jsonb_agg(to_jsonb(sources)) from sources),'[]'::jsonb),
'topReferrers',coalesce((select jsonb_agg(to_jsonb(refs)) from refs),'[]'::jsonb),
'daily',coalesce((select jsonb_agg(to_jsonb(days)) from days),'[]'::jsonb));
$$;
revoke all on function public.admin_traffic_summary(timestamptz) from public,anon,authenticated;
grant execute on function public.admin_traffic_summary(timestamptz) to service_role;
