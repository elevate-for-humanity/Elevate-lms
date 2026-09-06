-- Make lesson notes a durable, learner-owned notebook record.

alter table public.lesson_notes
  alter column position_seconds type integer
    using case when position_seconds ~ '^[0-9]+$' then position_seconds::integer else null end,
  alter column user_id set not null,
  alter column lesson_id set not null;

alter table public.lesson_notes
  drop constraint if exists lesson_notes_user_id_fkey,
  drop constraint if exists lesson_notes_lesson_id_fkey;
alter table public.lesson_notes
  add constraint lesson_notes_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- public.lessons is a compatibility view across course lesson stores, so a
-- physical foreign key is intentionally not possible. Access is validated by
-- assertLessonAccess before every API read or write.

create index if not exists lesson_notes_user_lesson_created_idx
  on public.lesson_notes(user_id, lesson_id, created_at desc);
create index if not exists lesson_notes_body_search_idx
  on public.lesson_notes using gin(to_tsvector('english', coalesce(body, '')));

create policy lesson_notes_owner_select
  on public.lesson_notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy lesson_notes_owner_insert
  on public.lesson_notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy lesson_notes_owner_update
  on public.lesson_notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy lesson_notes_owner_delete
  on public.lesson_notes for delete to authenticated
  using ((select auth.uid()) = user_id);
