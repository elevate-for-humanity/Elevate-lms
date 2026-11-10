import type { OpenHandsLifecycle } from './client';

const statuses = new Set(['queued', 'running', 'completed', 'failed', 'approval_required']);
const identifier = /^[A-Za-z0-9_-]{1,128}$/;
const state = /^[A-Za-z_ -]{1,40}$/;
const repository = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;
const branch = /^(?!.*(?:\.\.|\/\/))[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/;

function scalar(value: unknown, pattern: RegExp): string | null {
  return typeof value === 'string' && pattern.test(value) ? value : null;
}

/** Provider payloads can contain session credentials; browser responses use only this projection. */
export function publicOpenHandsLifecycle(lifecycle: OpenHandsLifecycle): Omit<OpenHandsLifecycle, 'raw'> {
  return {
    status: statuses.has(lifecycle.status) ? lifecycle.status : 'failed',
    startTaskId: scalar(lifecycle.startTaskId, identifier),
    conversationId: scalar(lifecycle.conversationId, identifier),
    sandboxStatus: scalar(lifecycle.sandboxStatus, state),
    executionStatus: scalar(lifecycle.executionStatus, state),
    repository: scalar(lifecycle.repository, repository),
    branch: scalar(lifecycle.branch, branch),
    prNumbers: Array.isArray(lifecycle.prNumbers)
      ? lifecycle.prNumbers.filter(number => Number.isSafeInteger(number) && number > 0).slice(0, 100)
      : [],
    error: lifecycle.error ? 'OpenHands provider reported an error.' : null,
  };
}

/** Hide legacy provider payloads at read time without rewriting task/step history. */
export function publicOpenHandsEvidence<T>(value: T): T {
  const visit = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(visit);
    if (!item || typeof item !== 'object') return item;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(item)) {
      if (key.toLowerCase() === 'raw') continue;
      if (/api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key|client[_-]?secret|password|authorization|cookie/i.test(key)) {
        result[key] = '[REDACTED]';
      } else if (key === 'lifecycle' && child && typeof child === 'object' && !Array.isArray(child)) {
        result[key] = publicOpenHandsLifecycle(child as OpenHandsLifecycle);
      } else {
        result[key] = visit(child);
      }
    }
    return result;
  };
  return visit(value) as T;
}
