-- exam monitoring layer
-- creates exam_events table + review workflow fields on exam_sessions

create extension if not exists pgcrypto;

create table if not exists public.exam_events (
  id uuid primary key default gen_random_uuid(),
  exam_session_id uuid not null references public.exam_sessions(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_exam_events_exam_session_id
  on public.exam_events (exam_session_id);

create index if not exists idx_exam_events_event_type
  on public.exam_events (event_type);

create index if not exists idx_exam_events_created_at
  on public.exam_events (created_at desc);

alter table public.exam_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'exam_events'
      and policyname = 'Users can insert their own exam events'
  ) then
    create policy "Users can insert their own exam events"
      on public.exam_events
      for insert
      to authenticated
      with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'exam_events'
      and policyname = 'Admins can read exam events'
  ) then
    create policy "Admins can read exam events"
      on public.exam_events
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'super_admin', 'staff', 'instructor')
        )
      );
  end if;
end $$;

alter table public.exam_sessions
  add column if not exists review_status text not null default 'clear';

alter table public.exam_sessions
  add column if not exists flag_reason text null;

alter table public.exam_sessions
  add column if not exists flagged_at timestamptz null;

alter table public.exam_sessions
  add column if not exists event_count integer not null default 0;

alter table public.exam_sessions
  add column if not exists tab_switch_count integer not null default 0;

alter table public.exam_sessions
  add column if not exists fullscreen_exit_count integer not null default 0;

alter table public.exam_sessions
  add column if not exists recording_url text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'exam_sessions_review_status_check'
  ) then
    alter table public.exam_sessions
      add constraint exam_sessions_review_status_check
      check (review_status in ('clear', 'flagged', 'under_review', 'invalidated'));
  end if;
end $$;

create or replace function public.handle_exam_event_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.exam_sessions
  set
    event_count = coalesce(event_count, 0) + 1,
    tab_switch_count = case
      when new.event_type in ('tab_hidden', 'window_blur') then coalesce(tab_switch_count, 0) + 1
      else coalesce(tab_switch_count, 0)
    end,
    fullscreen_exit_count = case
      when new.event_type = 'fullscreen_exit' then coalesce(fullscreen_exit_count, 0) + 1
      else coalesce(fullscreen_exit_count, 0)
    end,
    review_status = case
      when
        (
          case
            when new.event_type in ('tab_hidden', 'window_blur') then coalesce(tab_switch_count, 0) + 1
            else coalesce(tab_switch_count, 0)
          end
        ) >= 3
        or
        (
          case
            when new.event_type = 'fullscreen_exit' then coalesce(fullscreen_exit_count, 0) + 1
            else coalesce(fullscreen_exit_count, 0)
          end
        ) >= 2
        or new.event_type in ('devtools_detected', 'automation_detected', 'camera_denied', 'camera_stopped')
      then 'flagged'
      else review_status
    end,
    flag_reason = case
      when new.event_type in ('devtools_detected', 'automation_detected', 'camera_denied', 'camera_stopped')
        then concat('Flagged by event: ', new.event_type)
      when
        (
          case
            when new.event_type in ('tab_hidden', 'window_blur') then coalesce(tab_switch_count, 0) + 1
            else coalesce(tab_switch_count, 0)
          end
        ) >= 3
        then 'Flagged for repeated tab switching/window blur'
      when
        (
          case
            when new.event_type = 'fullscreen_exit' then coalesce(fullscreen_exit_count, 0) + 1
            else coalesce(fullscreen_exit_count, 0)
          end
        ) >= 2
        then 'Flagged for repeated fullscreen exits'
      else flag_reason
    end,
    flagged_at = case
      when
        (
          (
            case
              when new.event_type in ('tab_hidden', 'window_blur') then coalesce(tab_switch_count, 0) + 1
              else coalesce(tab_switch_count, 0)
            end
          ) >= 3
          or
          (
            case
              when new.event_type = 'fullscreen_exit' then coalesce(fullscreen_exit_count, 0) + 1
              else coalesce(fullscreen_exit_count, 0)
            end
          ) >= 2
          or new.event_type in ('devtools_detected', 'automation_detected', 'camera_denied', 'camera_stopped')
        )
        and flagged_at is null
      then now()
      else flagged_at
    end
  where id = new.exam_session_id;

  return new;
end;
$$;

drop trigger if exists trg_handle_exam_event_counters on public.exam_events;

create trigger trg_handle_exam_event_counters
after insert on public.exam_events
for each row
execute function public.handle_exam_event_counters();
