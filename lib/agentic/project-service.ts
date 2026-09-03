import crypto from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import type {
  AgenticInputMode,
  AgenticProjectLifecycleStatus,
  AgenticProjectRecord,
  AgenticProjectSourceType,
  AgenticTargetType,
} from './types';
import { assertAgenticProjectTransition } from './project-lifecycle';

function hashResumeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createResumeToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export async function createAgenticProject(input: {
  targetType: AgenticTargetType;
  title: string;
  originalPrompt?: string;
  locale?: string;
  tenantId?: string | null;
  userId?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  resumeToken?: string;
  sourceType?: AgenticProjectSourceType;
}): Promise<{ project: AgenticProjectRecord; resumeToken: string | null }> {
  const db = await requireAdminClient();
  const resumeToken = input.resumeToken ?? (!input.userId ? createResumeToken() : null);
  const baseRow = {
    tenant_id: input.tenantId ?? null,
    user_id: input.userId ?? null,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    title: input.title,
    original_prompt: input.originalPrompt ?? null,
    locale: input.locale ?? 'en',
    resume_token_hash: resumeToken ? hashResumeToken(resumeToken) : null,
    metadata: input.metadata ?? {},
  };
  let { data, error } = await db
    .from('agentic_build_projects')
    .insert({
      ...baseRow,
      lifecycle_status: 'discovery',
      source_type: input.sourceType ?? (input.originalPrompt ? 'prompt' : 'blank'),
    })
    .select('*')
    .single();

  // Production migrations are applied independently of application rollout.
  // Preserve creation during that compatibility window. Migration defaults
  // populate the canonical lifecycle after the columns become available.
  if (
    error?.code === '42703' ||
    error?.message?.includes('lifecycle_status') ||
    error?.message?.includes('source_type')
  ) {
    const legacy = await db.from('agentic_build_projects').insert(baseRow).select('*').single();
    data = legacy.data;
    error = legacy.error;
  }

  if (error || !data) {
    throw new Error(`Unable to create agentic project: ${error?.message || 'unknown error'}`);
  }

  return { project: data as AgenticProjectRecord, resumeToken };
}

export async function transitionAgenticProject(input: {
  project: AgenticProjectRecord;
  to: AgenticProjectLifecycleStatus;
  actorId?: string | null;
  reason?: string;
  evidence?: Array<Record<string, unknown>>;
}): Promise<AgenticProjectRecord> {
  const db = await requireAdminClient();
  const from = input.project.lifecycle_status ?? 'discovery';
  assertAgenticProjectTransition(from, input.to);

  const now = new Date().toISOString();
  const { data, error } = await db
    .from('agentic_build_projects')
    .update({ lifecycle_status: input.to, updated_at: now })
    .eq('id', input.project.id)
    .eq('lifecycle_status', from)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`Unable to transition agentic project: ${error.message}`);
  if (!data)
    throw new Error('Agentic project changed while its lifecycle transition was being applied');

  const { error: eventError } = await db.from('agentic_build_events').insert({
    project_id: input.project.id,
    event_type: 'agentic.project.lifecycle_transitioned',
    summary: `${from} -> ${input.to}`,
    payload: {
      from,
      to: input.to,
      actor_id: input.actorId ?? null,
      reason: input.reason ?? null,
      evidence: input.evidence ?? [],
    },
  });
  if (eventError)
    throw new Error(`Unable to audit agentic project transition: ${eventError.message}`);
  return data as AgenticProjectRecord;
}

export async function loadAgenticProject(input: {
  projectId: string;
  userId?: string | null;
  resumeToken?: string | null;
}): Promise<AgenticProjectRecord | null> {
  const db = await requireAdminClient();
  let query = db.from('agentic_build_projects').select('*').eq('id', input.projectId);

  if (input.userId) {
    query = query.eq('user_id', input.userId);
  } else if (input.resumeToken) {
    query = query.eq('resume_token_hash', hashResumeToken(input.resumeToken));
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Unable to load agentic project: ${error.message}`);
  return data ? (data as AgenticProjectRecord) : null;
}

export async function loadLatestAgenticProjectForUser(input: {
  userId: string;
  targetType: AgenticTargetType;
}): Promise<AgenticProjectRecord | null> {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('agentic_build_projects')
    .select('*')
    .eq('user_id', input.userId)
    .eq('target_type', input.targetType)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Unable to load owned agentic project: ${error.message}`);
  return data ? (data as AgenticProjectRecord) : null;
}

export async function updateAgenticProjectMetadata(input: {
  project: AgenticProjectRecord;
  metadata: Record<string, unknown>;
  locale?: string;
  targetId?: string | null;
  status?: AgenticProjectRecord['status'];
}): Promise<AgenticProjectRecord> {
  const db = await requireAdminClient();
  const merged = { ...(input.project.metadata ?? {}), ...input.metadata };
  const patch: Record<string, unknown> = {
    metadata: merged,
    updated_at: new Date().toISOString(),
  };
  if (input.locale) patch.locale = input.locale;
  if (input.targetId !== undefined) patch.target_id = input.targetId;
  if (input.status) patch.status = input.status;

  const { data, error } = await db
    .from('agentic_build_projects')
    .update(patch)
    .eq('id', input.project.id)
    .select('*')
    .single();

  if (error || !data)
    throw new Error(`Unable to update agentic project: ${error?.message || 'unknown error'}`);
  return data as AgenticProjectRecord;
}

export async function appendAgenticMessage(input: {
  projectId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  locale?: string;
  inputMode?: AgenticInputMode;
  confirmed?: boolean;
  runId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = await requireAdminClient();
  const { error } = await db.from('agentic_build_messages').insert({
    project_id: input.projectId,
    run_id: input.runId ?? null,
    role: input.role,
    content: input.content,
    locale: input.locale ?? 'en',
    input_mode: input.inputMode ?? 'text',
    confirmed: input.confirmed ?? true,
    metadata: input.metadata ?? {},
  });
  if (error) throw new Error(`Unable to append agentic message: ${error.message}`);
}

export async function listAgenticMessages(projectId: string, limit = 100) {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('agentic_build_messages')
    .select('id, role, content, locale, input_mode, confirmed, metadata, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(Math.max(1, Math.min(limit, 250)));
  if (error) throw new Error(`Unable to load agentic messages: ${error.message}`);
  return data ?? [];
}

export async function recordAgenticEvent(input: {
  projectId: string;
  eventType: string;
  summary: string;
  payload?: Record<string, unknown>;
  runId?: string | null;
  taskId?: string | null;
}): Promise<void> {
  const db = await requireAdminClient();
  const { error } = await db.from('agentic_build_events').insert({
    project_id: input.projectId,
    run_id: input.runId ?? null,
    task_id: input.taskId ?? null,
    event_type: input.eventType,
    summary: input.summary,
    payload: input.payload ?? {},
  });
  if (error) throw new Error(`Unable to record agentic event: ${error.message}`);
}

export async function listAgenticEvents(projectId: string, limit = 50) {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('agentic_build_events')
    .select('id, event_type, summary, payload, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(limit, 100)));
  if (error) throw new Error(`Unable to load agentic events: ${error.message}`);
  return data ?? [];
}
