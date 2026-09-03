-- ai_conversation_memory: per-session chat history for the AI Studio console.
-- Stores user/assistant turns so Ellie has context across messages in a session.
-- Sessions are scoped to user_id + session_id. Rows expire after 7 days.

create table if not exists public.ai_conversation_memory (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  session_id  text        not null,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days')
);

create index if not exists ai_conversation_memory_user_session_idx
  on public.ai_conversation_memory(user_id, session_id, created_at);

create index if not exists ai_conversation_memory_expires_idx
  on public.ai_conversation_memory(expires_at);

-- RLS: users can only read/write their own memory rows
alter table public.ai_conversation_memory enable row level security;

create policy "Users manage own conversation memory"
  on public.ai_conversation_memory
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypass for admin API routes
create policy "Service role full access"
  on public.ai_conversation_memory
  for all
  to service_role
  using (true)
  with check (true);

-- Extend cleanup function to also purge expired conversation memory
create or replace function public.cleanup_expired_ai_memory()
returns integer language plpgsql security definer as $$
declare
  deleted_count integer;
  conv_deleted  integer;
begin
  -- Operator memory (ai_operator_memory)
  delete from public.ai_operator_memory
  where expires_at is not null and expires_at < now();
  get diagnostics deleted_count = row_count;

  -- Conversation memory (ai_conversation_memory)
  delete from public.ai_conversation_memory
  where expires_at < now();
  get diagnostics conv_deleted = row_count;

  return deleted_count + conv_deleted;
end;
$$;
