import 'server-only';

export type OpenHandsLifecycleStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'approval_required';

export type OpenHandsStartTask = {
  id: string;
  status: string;
  app_conversation_id?: string | null;
  sandbox_id?: string | null;
  error?: string | null;
  created_at?: string | null;
};

export type OpenHandsConversation = {
  id: string;
  sandbox_status?: string | null;
  execution_status?: string | null;
  selected_repository?: string | null;
  selected_branch?: string | null;
  title?: string | null;
  pr_number?: number[] | number | null;
  url?: string | null;
  error?: string | null;
  [key: string]: unknown;
};

export type OpenHandsLifecycle = {
  status: OpenHandsLifecycleStatus;
  startTaskId?: string | null;
  conversationId?: string | null;
  sandboxStatus?: string | null;
  executionStatus?: string | null;
  repository?: string | null;
  branch?: string | null;
  prNumbers?: number[];
  error?: string | null;
  raw?: unknown;
};

export type StartOpenHandsTaskInput = {
  message: string;
  repository?: string | null;
  traceId?: string | null;
  taskId?: string | null;
  tags?: string[];
};

export type OpenHandsSendMessageResult = {
  success: boolean;
  sandbox_status?: string | null;
  message?: string | null;
};

const DEFAULT_ORIGIN = 'https://app.all-hands.dev';
const DEFAULT_REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_MESSAGE_CHARS = 30_000;

function normalizeOrigin(value: string | undefined): string {
  const raw = (value || DEFAULT_ORIGIN).trim().replace(/\/$/, '');
  return raw
    .replace(/\/api\/v1$/i, '')
    .replace(/\/api$/i, '')
    .replace(/\/$/, '');
}

export function getOpenHandsConfig() {
  const apiKey = process.env.OPENHANDS_API_KEY?.trim() || '';
  const origin = normalizeOrigin(process.env.OPENHANDS_API_URL);
  const configuredRepository =
    process.env.OPENHANDS_REPOSITORY?.trim() ||
    process.env.GITHUB_REPO?.trim() ||
    DEFAULT_REPOSITORY;
  const model = process.env.OPENHANDS_MODEL?.trim() || null;
  return {
    apiKey,
    origin,
    configuredRepository,
    model,
    configured: Boolean(apiKey),
  };
}

function headers(apiKey: string): HeadersInit {
  return {
    // The Cloud guide documents Bearer auth while the generated V1 reference
    // documents X-Access-Token. Supplying both keeps the client compatible
    // with the documented Cloud gateway without exposing either to browsers.
    Authorization: `Bearer ${apiKey}`,
    'X-Access-Token': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => '');
}

async function requestJson(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const config = getOpenHandsConfig();
  if (!config.apiKey) throw new Error('OpenHands API key is not configured');

  const response = await fetch(`${config.origin}${path}`, {
    ...init,
    headers: {
      ...headers(config.apiKey),
      ...(init.headers ?? {}),
    },
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload
        ? JSON.stringify((payload as { detail?: unknown }).detail)
        : typeof payload === 'string'
          ? payload.slice(0, 500)
          : JSON.stringify(payload).slice(0, 500);
    throw new Error(`OpenHands API ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return payload;
}

function firstItem<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  if (value && typeof value === 'object') {
    const maybeItems = (value as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) return (maybeItems[0] as T | undefined) ?? null;
    return value as T;
  }
  return null;
}

function validateRepository(repository?: string | null): string {
  const { configuredRepository } = getOpenHandsConfig();
  const requested = repository?.trim() || configuredRepository;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(requested)) {
    throw new Error('OpenHands repository must be an owner/repository identifier');
  }
  if (requested.toLowerCase() !== configuredRepository.toLowerCase()) {
    throw new Error('OpenHands repository is not on the configured allowlist');
  }
  return requested;
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) throw new Error('OpenHands task message is required');
  if (trimmed.length > MAX_MESSAGE_CHARS) {
    throw new Error(`OpenHands task message exceeds ${MAX_MESSAGE_CHARS} characters`);
  }
  return trimmed;
}

function validateConversationId(conversationId: string): string {
  const id = conversationId.trim();
import 'server-only';

export type OpenHandsLifecycleStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'approval_required';

export type OpenHandsStartTask = {
  id: string;
  status: string;
  app_conversation_id?: string | null;
  sandbox_id?: string | null;
  error?: string | null;
  created_at?: string | null;
};

export type OpenHandsConversation = {
  id: string;
  sandbox_status?: string | null;
  execution_status?: string | null;
  selected_repository?: string | null;
  selected_branch?: string | null;
  title?: string | null;
  pr_number?: number[] | number | null;
  url?: string | null;
  error?: string | null;
  [key: string]: unknown;
};

export type OpenHandsLifecycle = {
  status: OpenHandsLifecycleStatus;
  startTaskId?: string | null;
  conversationId?: string | null;
  sandboxStatus?: string | null;
  executionStatus?: string | null;
  repository?: string | null;
  branch?: string | null;
  prNumbers?: number[];
  error?: string | null;
  raw?: unknown;
};

export type StartOpenHandsTaskInput = {
  message: string;
  repository?: string | null;
  traceId?: string | null;
  taskId?: string | null;
  tags?: string[];
};

export type OpenHandsSendMessageResult = {
  success: boolean;
  sandbox_status?: string | null;
  message?: string | null;
};

const DEFAULT_ORIGIN = 'https://app.all-hands.dev';
const DEFAULT_REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_MESSAGE_CHARS = 30_000;

function normalizeOrigin(value: string | undefined): string {
  const raw = (value || DEFAULT_ORIGIN).trim().replace(/\/$/, '');
  return raw
    .replace(/\/api\/v1$/i, '')
    .replace(/\/api$/i, '')
    .replace(/\/$/, '');
}

export function getOpenHandsConfig() {
  const apiKey = process.env.OPENHANDS_API_KEY?.trim() || '';
  const origin = normalizeOrigin(process.env.OPENHANDS_API_URL);
  const configuredRepository =
    process.env.OPENHANDS_REPOSITORY?.trim() ||
    process.env.GITHUB_REPO?.trim() ||
    DEFAULT_REPOSITORY;
  const model = process.env.OPENHANDS_MODEL?.trim() || null;
  return {
    apiKey,
    origin,
    configuredRepository,
    model,
    configured: Boolean(apiKey),
  };
}

function headers(apiKey: string): HeadersInit {
  return {
    // The Cloud guide documents Bearer auth while the generated V1 reference
    // documents X-Access-Token. Supplying both keeps the client compatible
    // with the documented Cloud gateway without exposing either to browsers.
    Authorization: `Bearer ${apiKey}`,
    'X-Access-Token': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => '');
}

async function requestJson(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const config = getOpenHandsConfig();
  if (!config.apiKey) throw new Error('OpenHands API key is not configured');

  const response = await fetch(`${config.origin}${path}`, {
    ...init,
    headers: {
      ...headers(config.apiKey),
      ...(init.headers ?? {}),
    },
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload
        ? JSON.stringify((payload as { detail?: unknown }).detail)
        : typeof payload === 'string'
          ? payload.slice(0, 500)
          : JSON.stringify(payload).slice(0, 500);
    throw new Error(`OpenHands API ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return payload;
}

function firstItem<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  if (value && typeof value === 'object') {
    const maybeItems = (value as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) return (maybeItems[0] as T | undefined) ?? null;
    return value as T;
  }
  return null;
}

function validateRepository(repository?: string | null): string {
  const { configuredRepository } = getOpenHandsConfig();
  const requested = repository?.trim() || configuredRepository;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(requested)) {
    throw new Error('OpenHands repository must be an owner/repository identifier');
  }
  if (requested.toLowerCase() !== configuredRepository.toLowerCase()) {
    throw new Error('OpenHands repository is not on the configured allowlist');
  }
  return requested;
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) throw new Error('OpenHands task message is required');
  if (trimmed.length > MAX_MESSAGE_CHARS) {
    throw new Error(`OpenHands task message exceeds ${MAX_MESSAGE_CHARS} characters`);
  }
  return trimmed;
}

export function validateOpenHandsConversationId(conversationId: string): string {
  const id = conversationId.trim();
  // OpenHands treats conversation identifiers as opaque URL-safe strings. Cloud
  // currently returns compact hexadecimal IDs as well as UUID-shaped IDs, so
  // enforcing UUID syntax breaks lifecycle polling after a task is accepted.
  // Keep path construction safe without imposing a provider-specific shape.
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new Error('OpenHands conversation id is invalid');
  }
  return id;
}

export async function startOpenHandsTask(
  input: StartOpenHandsTaskInput,
): Promise<OpenHandsStartTask> {
  const message = normalizeMessage(input.message);
  const repository = validateRepository(input.repository);
  const { model } = getOpenHandsConfig();
  const metadata: Record<string, string | number | boolean | string[]> = {};
  if (input.traceId) metadata.trace_id = input.traceId;
  if (input.taskId) metadata.elevate_task_id = input.taskId;

  const payload = await requestJson('/api/v1/app-conversations', {
    method: 'POST',
    body: JSON.stringify({
      initial_message: {
        role: 'user',
        content: [{ type: 'text', text: message }],
        run: true,
      },
      selected_repository: repository,
      ...(model ? { llm_model: model } : {}),
      observability_span_name: 'elevate_openhands_engineering',
      observability_tags: ['elevate', 'dev-studio', ...(input.tags ?? [])].slice(0, 12),
      observability_metadata: metadata,
    }),
  });

  const task = firstItem<OpenHandsStartTask>(payload);
  if (!task?.id) throw new Error('OpenHands returned no start-task id');
  return task;
}

export async function sendOpenHandsMessage(
  conversationId: string,
  message: string,
): Promise<OpenHandsSendMessageResult> {
  const id = validateOpenHandsConversationId(conversationId);
  const text = normalizeMessage(message);
  const payload = await requestJson(
    `/api/v1/app-conversations/${encodeURIComponent(id)}/send-message`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: [{ type: 'text', text }],
        role: 'user',
        run: true,
      }),
    },
  );
  if (!payload || typeof payload !== 'object') {
    throw new Error('OpenHands returned an invalid follow-up response');
  }
  const result = payload as OpenHandsSendMessageResult;
  if (result.success !== true) throw new Error(result.message || 'OpenHands follow-up message failed');
  return result;
}

export async function getOpenHandsStartTask(startTaskId: string): Promise<OpenHandsStartTask | null> {
  const id = startTaskId.trim();
  if (!id) return null;
  const payload = await requestJson(
    `/api/v1/app-conversations/start-tasks?ids=${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
  return firstItem<OpenHandsStartTask>(payload);
}

export async function getOpenHandsConversation(
  conversationId: string,
): Promise<OpenHandsConversation | null> {
  const id = validateOpenHandsConversationId(conversationId);
  const payload = await requestJson(
    `/api/v1/app-conversations?ids=${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
  return firstItem<OpenHandsConversation>(payload);
}

function normalizePrNumbers(value: OpenHandsConversation['pr_number']): number[] {
  if (Array.isArray(value)) return value.filter((item): item is number => Number.isInteger(item));
  return typeof value === 'number' && Number.isInteger(value) ? [value] : [];
}

function lifecycleFromConversation(
  conversation: OpenHandsConversation,
  startTaskId?: string | null,
): OpenHandsLifecycle {
  const executionStatus = String(conversation.execution_status ?? '').toLowerCase();
  const sandboxStatus = String(conversation.sandbox_status ?? '').toUpperCase();

  let status: OpenHandsLifecycleStatus = 'running';
  if (executionStatus === 'finished') status = 'completed';
  else if (executionStatus === 'waiting_for_confirmation') status = 'approval_required';
  else if (['error', 'stuck'].includes(executionStatus) || ['ERROR', 'MISSING'].includes(sandboxStatus)) {
    status = 'failed';
  } else if (['idle', 'paused'].includes(executionStatus) || ['STARTING', 'PAUSED'].includes(sandboxStatus)) {
    status = 'queued';
  }

  return {
    status,
    startTaskId: startTaskId ?? null,
    conversationId: conversation.id,
    sandboxStatus: conversation.sandbox_status ?? null,
    executionStatus: conversation.execution_status ?? null,
    repository: conversation.selected_repository ?? null,
    branch: conversation.selected_branch ?? null,
    prNumbers: normalizePrNumbers(conversation.pr_number),
    error: conversation.error ?? null,
    raw: conversation,
  };
}

export async function getOpenHandsLifecycle(input: {
  startTaskId?: string | null;
  conversationId?: string | null;
}): Promise<OpenHandsLifecycle> {
  let conversationId = input.conversationId?.trim() || null;
  let startTask: OpenHandsStartTask | null = null;

  if (!conversationId && input.startTaskId) {
    startTask = await getOpenHandsStartTask(input.startTaskId);
    if (!startTask) {
      return {
        status: 'failed',
        startTaskId: input.startTaskId,
        error: 'OpenHands start task was not found',
      };
    }
    const startStatus = String(startTask.status ?? '').toUpperCase();
    if (startStatus === 'ERROR') {
      return {
        status: 'failed',
        startTaskId: startTask.id,
        conversationId: startTask.app_conversation_id ?? null,
        error: startTask.error || 'OpenHands conversation startup failed',
        raw: startTask,
      };
    }
    conversationId = startTask.app_conversation_id?.trim() || null;
    if (!conversationId) {
      return {
        status: startStatus === 'READY' ? 'running' : 'queued',
        startTaskId: startTask.id,
        raw: startTask,
      };
    }
  }

  if (!conversationId) {
    return { status: 'failed', error: 'OpenHands conversation identifier is missing' };
  }

  const conversation = await getOpenHandsConversation(conversationId);
  if (!conversation) {
    return {
      status: 'failed',
      startTaskId: startTask?.id ?? input.startTaskId ?? null,
      conversationId,
      error: 'OpenHands conversation was not found',
    };
  }
  return lifecycleFromConversation(conversation, startTask?.id ?? input.startTaskId ?? null);
}
 validateOpenHandsConversationId if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) {
    throw new Error('OpenHands conversation id is invalid');
  }
  return id;
}

export async function startOpenHandsTask(
  input: StartOpenHandsTaskInput,
): Promise<OpenHandsStartTask> {
  const message = normalizeMessage(input.message);
  const repository = validateRepository(input.repository);
  const { model } = getOpenHandsConfig();
  const metadata: Record<string, string | number | boolean | string[]> = {};
  if (input.traceId) metadata.trace_id = input.traceId;
  if (input.taskId) metadata.elevate_task_id = input.taskId;

  const payload = await requestJson('/api/v1/app-conversations', {
    method: 'POST',
    body: JSON.stringify({
      initial_message: {
        role: 'user',
        content: [{ type: 'text', text: message }],
        run: true,
      },
      selected_repository: repository,
      ...(model ? { llm_model: model } : {}),
      observability_span_name: 'elevate_openhands_engineering',
      observability_tags: ['elevate', 'dev-studio', ...(input.tags ?? [])].slice(0, 12),
      observability_metadata: metadata,
    }),
  });

  const task = firstItem<OpenHandsStartTask>(payload);
  if (!task?.id) throw new Error('OpenHands returned no start-task id');
  return task;
}

export async function sendOpenHandsMessage(
  conversationId: string,
  message: string,
): Promise<OpenHandsSendMessageResult> {
  const id = validateConversationId(conversationId);
  const text = normalizeMessage(message);
  const payload = await requestJson(
    `/api/v1/app-conversations/${encodeURIComponent(id)}/send-message`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: [{ type: 'text', text }],
        role: 'user',
        run: true,
      }),
    },
  );
  if (!payload || typeof payload !== 'object') {
    throw new Error('OpenHands returned an invalid follow-up response');
  }
  const result = payload as OpenHandsSendMessageResult;
  if (result.success !== true) throw new Error(result.message || 'OpenHands follow-up message failed');
  return result;
}

export async function getOpenHandsStartTask(startTaskId: string): Promise<OpenHandsStartTask | null> {
  const id = startTaskId.trim();
  if (!id) return null;
  const payload = await requestJson(
    `/api/v1/app-conversations/start-tasks?ids=${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
  return firstItem<OpenHandsStartTask>(payload);
}

export async function getOpenHandsConversation(
  conversationId: string,
): Promise<OpenHandsConversation | null> {
  const id = validateConversationId(conversationId);
  const payload = await requestJson(
    `/api/v1/app-conversations?ids=${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
  return firstItem<OpenHandsConversation>(payload);
}

function normalizePrNumbers(value: OpenHandsConversation['pr_number']): number[] {
  if (Array.isArray(value)) return value.filter((item): item is number => Number.isInteger(item));
  return typeof value === 'number' && Number.isInteger(value) ? [value] : [];
}

function lifecycleFromConversation(
  conversation: OpenHandsConversation,
  startTaskId?: string | null,
): OpenHandsLifecycle {
  const executionStatus = String(conversation.execution_status ?? '').toLowerCase();
  const sandboxStatus = String(conversation.sandbox_status ?? '').toUpperCase();

  let status: OpenHandsLifecycleStatus = 'running';
  if (executionStatus === 'finished') status = 'completed';
  else if (executionStatus === 'waiting_for_confirmation') status = 'approval_required';
  else if (['error', 'stuck'].includes(executionStatus) || ['ERROR', 'MISSING'].includes(sandboxStatus)) {
    status = 'failed';
  } else if (['idle', 'paused'].includes(executionStatus) || ['STARTING', 'PAUSED'].includes(sandboxStatus)) {
    status = 'queued';
  }

  return {
    status,
    startTaskId: startTaskId ?? null,
    conversationId: conversation.id,
    sandboxStatus: conversation.sandbox_status ?? null,
    executionStatus: conversation.execution_status ?? null,
    repository: conversation.selected_repository ?? null,
    branch: conversation.selected_branch ?? null,
    prNumbers: normalizePrNumbers(conversation.pr_number),
    error: conversation.error ?? null,
    raw: conversation,
  };
}

export async function getOpenHandsLifecycle(input: {
  startTaskId?: string | null;
  conversationId?: string | null;
}): Promise<OpenHandsLifecycle> {
  let conversationId = input.conversationId?.trim() || null;
  let startTask: OpenHandsStartTask | null = null;

  if (!conversationId && input.startTaskId) {
    startTask = await getOpenHandsStartTask(input.startTaskId);
    if (!startTask) {
      return {
        status: 'failed',
        startTaskId: input.startTaskId,
        error: 'OpenHands start task was not found',
      };
    }
    const startStatus = String(startTask.status ?? '').toUpperCase();
    if (startStatus === 'ERROR') {
      return {
        status: 'failed',
        startTaskId: startTask.id,
        conversationId: startTask.app_conversation_id ?? null,
        error: startTask.error || 'OpenHands conversation startup failed',
        raw: startTask,
      };
    }
    conversationId = startTask.app_conversation_id?.trim() || null;
    if (!conversationId) {
      return {
        status: startStatus === 'READY' ? 'running' : 'queued',
        startTaskId: startTask.id,
        raw: startTask,
      };
    }
  }

  if (!conversationId) {
    return { status: 'failed', error: 'OpenHands conversation identifier is missing' };
  }

  const conversation = await getOpenHandsConversation(conversationId);
  if (!conversation) {
    return {
      status: 'failed',
      startTaskId: startTask?.id ?? input.startTaskId ?? null,
      conversationId,
      error: 'OpenHands conversation was not found',
    };
  }
  return lifecycleFromConversation(conversation, startTask?.id ?? input.startTaskId ?? null);
}
