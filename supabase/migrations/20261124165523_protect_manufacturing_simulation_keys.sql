-- Private, immutable grading versions. Public lessons and course snapshots carry
-- only problems plus a gradingKeyId. Existing learner records are preserved.
create schema if not exists rpc_private;
grant usage on schema rpc_private to service_role;

create table if not exists public.manufacturing_simulation_specs (
  id uuid primary key default gen_random_uuid(),
  -- Keep historical lesson identity after lesson deletion so snapshots can restore it.
  lesson_id uuid not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  spec jsonb not null check (
    jsonb_typeof(spec) = 'object' and spec->>'version' = '1'
    and jsonb_typeof(spec->'tasks') = 'array'
  ),
  created_at timestamptz not null default now()
);
alter table public.manufacturing_simulation_specs enable row level security;
revoke all on public.manufacturing_simulation_specs from public, anon, authenticated, service_role;
grant select, insert on public.manufacturing_simulation_specs to service_role;
drop policy if exists manufacturing_specs_service on public.manufacturing_simulation_specs;
create policy manufacturing_specs_service on public.manufacturing_simulation_specs
  for all to service_role using (true) with check (true);
create index if not exists manufacturing_simulation_specs_lesson_idx
  on public.manufacturing_simulation_specs(course_id, lesson_id);

create table if not exists public.manufacturing_simulation_progress (
  learner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  spec_id uuid not null references public.manufacturing_simulation_specs(id) on delete cascade,
  lesson_slug text not null,
  interaction_id text not null,
  interaction_type text not null default 'simulation' check (interaction_type = 'simulation'),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  score integer not null check (score between 0 and 100),
  completed boolean not null default false,
  attempts integer not null check (attempts > 0),
  weak_objectives jsonb not null default '[]'::jsonb,
  feedback jsonb not null,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (learner_id, lesson_id, interaction_id)
);
alter table public.manufacturing_simulation_progress enable row level security;
revoke all on public.manufacturing_simulation_progress from public, anon, authenticated, service_role;
grant select, insert, update on public.manufacturing_simulation_progress to service_role;
drop policy if exists manufacturing_progress_service on public.manufacturing_simulation_progress;
create policy manufacturing_progress_service on public.manufacturing_simulation_progress
  for all to service_role using (true) with check (true);
create index if not exists manufacturing_simulation_progress_course_idx
  on public.manufacturing_simulation_progress(course_id, learner_id);

create or replace function rpc_private.manufacturing_public_spec(p_spec jsonb)
returns jsonb language plpgsql immutable strict security invoker
set search_path = pg_catalog
as $$
begin
  if jsonb_typeof(p_spec) is distinct from 'object'
     or jsonb_typeof(p_spec->'tasks') is distinct from 'array' then
    raise exception 'MANUFACTURING_SPEC_INVALID' using errcode = '23514';
  end if;
  if jsonb_array_length(p_spec->'tasks') not between 1 and 50
     or exists (select 1 from jsonb_array_elements(p_spec->'tasks') task
                where jsonb_typeof(task) is distinct from 'object') then
    raise exception 'MANUFACTURING_SPEC_INVALID' using errcode = '23514';
  end if;
  return jsonb_set(p_spec - 'gradingKeyId', '{tasks}', (
    select jsonb_agg(task - 'expected' - 'rationale' order by position)
    from jsonb_array_elements(p_spec->'tasks') with ordinality as t(task, position)
  ));
end;
$$;

create or replace function rpc_private.manufacturing_normalized_content(p_content jsonb)
returns jsonb language plpgsql immutable security invoker
set search_path = pg_catalog
as $$
declare v_parsed jsonb;
begin
  if jsonb_typeof(p_content) = 'string' then
    begin v_parsed := (p_content #>> '{}')::jsonb;
    exception when invalid_text_representation then return p_content; end;
    if jsonb_typeof(v_parsed) = 'object'
       and v_parsed #> '{experience,manufacturingSimulation}' is not null then
      return v_parsed;
    end if;
  end if;
  return p_content;
end;
$$;

create or replace function rpc_private.store_manufacturing_simulation_spec(
  p_spec jsonb, p_lesson_id uuid, p_course_id uuid
)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public, rpc_private
as $$
declare
  v_public jsonb;
  v_key_count integer;
  v_id uuid;
  v_existing public.manufacturing_simulation_specs%rowtype;
begin
  v_public := rpc_private.manufacturing_public_spec(p_spec);
  if p_lesson_id is null or p_course_id is null then
    raise exception 'MANUFACTURING_LESSON_ID_REQUIRED' using errcode = '23514';
  end if;
  select count(*) into v_key_count from jsonb_array_elements(p_spec->'tasks') task
    where task ? 'expected' and task ? 'rationale';
  if v_key_count = jsonb_array_length(p_spec->'tasks') then
    insert into public.manufacturing_simulation_specs(lesson_id, course_id, spec)
      values (p_lesson_id, p_course_id, p_spec - 'gradingKeyId') returning id into v_id;
  elsif exists (select 1 from jsonb_array_elements(p_spec->'tasks') task
                 where task ? 'expected' or task ? 'rationale') then
    raise exception 'MANUFACTURING_ANSWER_KEY_INCOMPLETE' using errcode = '23514';
  else
    if coalesce(p_spec->>'gradingKeyId', '') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
      raise exception 'MANUFACTURING_ANSWER_KEY_REQUIRED' using errcode = '23514';
    end if;
    select * into v_existing from public.manufacturing_simulation_specs
      where id = (p_spec->>'gradingKeyId')::uuid;
    if not found or rpc_private.manufacturing_public_spec(v_existing.spec) <> v_public then
      raise exception 'MANUFACTURING_ANSWER_KEY_MISMATCH' using errcode = '23514';
    end if;
    v_id := v_existing.id;
    if v_existing.lesson_id <> p_lesson_id or v_existing.course_id <> p_course_id then
      -- Authorized course copies receive an independent grading identity. No
      -- student progress is copied, and the public payload never contains keys.
      insert into public.manufacturing_simulation_specs(lesson_id, course_id, spec)
        values (p_lesson_id, p_course_id, v_existing.spec) returning id into v_id;
    end if;
  end if;
  return v_public || jsonb_build_object('gradingKeyId', v_id);
end;
$$;

create or replace function rpc_private.protect_manufacturing_lesson_payload(p_lesson jsonb, p_course_id uuid)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public, rpc_private
as $$
declare v_field text; v_content jsonb; v_spec jsonb; v_public jsonb;
begin
  foreach v_field in array array['content_json', 'content'] loop
    v_content := rpc_private.manufacturing_normalized_content(p_lesson->v_field);
    v_spec := nullif(v_content #> '{experience,manufacturingSimulation}', 'null'::jsonb);
    if v_spec is null then continue; end if;
    v_public := rpc_private.store_manufacturing_simulation_spec(
      v_spec, (p_lesson->>'id')::uuid, p_course_id
    );
    p_lesson := jsonb_set(p_lesson, array[v_field],
      jsonb_set(v_content, '{experience,manufacturingSimulation}', v_public));
  end loop;
  return p_lesson;
end;
$$;

create or replace function rpc_private.protect_manufacturing_simulation_keys()
returns trigger language plpgsql security invoker
set search_path = pg_catalog, public, rpc_private
as $$
declare v_payload jsonb; v_before jsonb; v_content jsonb; v_has_spec boolean := false;
begin
  -- Trigger execution must remain transparent to ordinary authenticated authors.
  -- Do not call service-only helpers until an actual manufacturing spec is found.
  foreach v_content in array array[new.content_json, new.content] loop
    if jsonb_typeof(v_content) = 'string' then
      begin v_content := (v_content #>> '{}')::jsonb;
      exception when invalid_text_representation then continue; end;
    end if;
    if nullif(v_content #> '{experience,manufacturingSimulation}', 'null'::jsonb) is not null then
      v_has_spec := true;
      exit;
    end if;
  end loop;
  if not v_has_spec then return new; end if;
  v_before := jsonb_build_object(
    'id', new.id, 'content_json', new.content_json, 'content', new.content
  );
  v_payload := rpc_private.protect_manufacturing_lesson_payload(v_before, new.course_id);
  if v_payload->'content_json' is distinct from v_before->'content_json' then
    new.content_json := v_payload->'content_json';
  end if;
  if v_payload->'content' is distinct from v_before->'content' then
    new.content := v_payload->'content';
  end if;
  return new;
end;
$$;

create or replace function rpc_private.protect_manufacturing_snapshot_keys()
returns trigger language plpgsql security invoker
set search_path = pg_catalog, public, rpc_private
as $$
declare v_lessons jsonb := '[]'::jsonb; v_lesson jsonb; v_content jsonb; v_has_spec boolean;
begin
  if jsonb_typeof(new.snapshot->'lessons') is distinct from 'array' then return new; end if;
  for v_lesson in select value from jsonb_array_elements(new.snapshot->'lessons') loop
    v_has_spec := false;
    foreach v_content in array array[v_lesson->'content_json', v_lesson->'content'] loop
      if jsonb_typeof(v_content) = 'string' then
        begin v_content := (v_content #>> '{}')::jsonb;
        exception when invalid_text_representation then continue; end;
      end if;
      if nullif(v_content #> '{experience,manufacturingSimulation}', 'null'::jsonb) is not null then
        v_has_spec := true;
        exit;
      end if;
    end loop;
    if v_has_spec then
      v_lesson := rpc_private.protect_manufacturing_lesson_payload(v_lesson, new.course_id);
    end if;
    v_lessons := v_lessons || jsonb_build_array(v_lesson);
  end loop;
  new.snapshot := jsonb_set(new.snapshot, '{lessons}', v_lessons);
  return new;
end;
$$;

revoke all on function rpc_private.manufacturing_public_spec(jsonb),
  rpc_private.manufacturing_normalized_content(jsonb),
  rpc_private.store_manufacturing_simulation_spec(jsonb, uuid, uuid),
  rpc_private.protect_manufacturing_lesson_payload(jsonb, uuid),
  rpc_private.protect_manufacturing_simulation_keys(),
  rpc_private.protect_manufacturing_snapshot_keys() from public, anon, authenticated;
grant execute on function rpc_private.manufacturing_public_spec(jsonb),
  rpc_private.manufacturing_normalized_content(jsonb),
  rpc_private.store_manufacturing_simulation_spec(jsonb, uuid, uuid),
  rpc_private.protect_manufacturing_lesson_payload(jsonb, uuid),
  rpc_private.protect_manufacturing_simulation_keys(),
  rpc_private.protect_manufacturing_snapshot_keys() to service_role;

drop trigger if exists protect_manufacturing_simulation_keys on public.course_lessons;
create trigger protect_manufacturing_simulation_keys
  before insert or update of content_json, content, course_id on public.course_lessons
  for each row execute function rpc_private.protect_manufacturing_simulation_keys();
drop trigger if exists protect_manufacturing_snapshot_keys on public.course_versions;
create trigger protect_manufacturing_snapshot_keys
  before insert or update of snapshot, course_id on public.course_versions
  for each row execute function rpc_private.protect_manufacturing_snapshot_keys();

-- Normal review/media/publication triggers remain enabled. No course, lesson,
-- enrollment, equipment authorization, or practical hour is granted here.
update public.course_lessons set content_json = content_json
where nullif(rpc_private.manufacturing_normalized_content(content_json)
        #> '{experience,manufacturingSimulation}', 'null'::jsonb) is not null
   or nullif(rpc_private.manufacturing_normalized_content(content)
        #> '{experience,manufacturingSimulation}', 'null'::jsonb) is not null;
update public.course_versions set snapshot = snapshot
where snapshot::text like '%manufacturingSimulation%';

comment on table public.manufacturing_simulation_specs is
  'Immutable, service-only grading versions; retained for snapshots and rollback until course deletion.';
comment on table public.manufacturing_simulation_progress is
  'Service-only virtual practice bound to the submitted grading version. No equipment authorization or practical hours.';
