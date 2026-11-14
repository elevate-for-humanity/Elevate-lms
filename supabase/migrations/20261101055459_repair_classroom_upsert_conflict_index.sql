-- PostgREST's on_conflict=user_id,course_id cannot infer the existing partial
-- index without a predicate. A full unique index has the same non-null row
-- semantics (PostgreSQL still permits multiple NULL course_id values).
-- Build the replacement first so uniqueness is never absent.
create unique index if not exists google_classroom_sync_upsert_uidx
  on public.google_classroom_sync(user_id, course_id);
drop index if exists public.google_classroom_sync_user_course_uidx;
