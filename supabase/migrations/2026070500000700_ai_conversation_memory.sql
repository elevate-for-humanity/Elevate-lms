-- ai_conversation_memory: per-session conversation history for the admin AI assistant.
-- Keyed by session_id (client-generated). Used by /api/admin/ai-assistant to persist
-- and retrieve multi-turn context without re-sending full history on every request.
-- TTL: 30 days via expires_at.

create table if not exists public.ai_conversation_memory (
  id          uuid        primary key default gen_random_uuid(),
  session_id  text        not null unique,
  user_id     uuid        references auth.users(id) on delete cascade,
  messages    jsonb       not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '30 days')
);

create index if not exists ai_conversation_memory_session_idx
  on public.ai_conversation_memory (session_id);

create index if not exists ai_conversation_memory_user_idx
  on public.ai_conversation_memory (user_id);

create index if not exists ai_conversation_memory_expires_idx
  on public.ai_conversation_memory (expires_at);

alter table public.ai_conversation_memory enable row level security;

-- Service role has full access (API routes use service role)
create policy "service_role_all" on public.ai_conversation_memory
  for all to service_role using (true) with check (true);

-- Users can read/delete their own sessions
create policy "users_own_sessions" on public.ai_conversation_memory
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
