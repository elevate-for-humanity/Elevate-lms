create table if not exists public.lesson_learning_objects (
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  course_id uuid not null,
  object_id text not null,
  type text not null,
  title text not null,
  order_index integer not null check (order_index >= 0),
  required boolean not null default true,
  completion text not null check (completion in ('view','score','submission','media','conditional')),
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (lesson_id, object_id),
  unique (lesson_id, order_index)
);

alter table public.lesson_learning_objects enable row level security;

create policy "Enrolled learners can read lesson learning objects"
on public.lesson_learning_objects for select to authenticated
using (
  exists (
    select 1 from public.course_enrollments e
    where e.course_id = lesson_learning_objects.course_id and e.student_id = (select auth.uid())
  )
);

create policy "Service role manages lesson learning objects"
on public.lesson_learning_objects for all to service_role using (true) with check (true);

create or replace function public.sync_lesson_learning_objects()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.lesson_learning_objects where lesson_id = new.id;
  insert into public.lesson_learning_objects
    (lesson_id, course_id, object_id, type, title, order_index, required, completion, source, metadata)
  select new.id, new.course_id, item->>'id', item->>'type', item->>'title',
    coalesce((item->>'order')::integer, ordinality::integer - 1),
    coalesce((item->>'required')::boolean, true), item->>'completion', item->>'source', item
  from jsonb_array_elements(coalesce(new.content_json->'learning_objects', '[]'::jsonb)) with ordinality as objects(item, ordinality)
  where item ? 'id' and item ? 'type' and item ? 'title' and item ? 'completion';
  return new;
end;
$$;

drop trigger if exists sync_lesson_learning_objects_trigger on public.course_lessons;
create trigger sync_lesson_learning_objects_trigger
after insert or update of content_json, course_id on public.course_lessons
for each row execute function public.sync_lesson_learning_objects();

update public.course_lessons set content_json = content_json
where jsonb_typeof(content_json->'learning_objects') = 'array';
