import 'server-only';

import { loadSharedContext } from '@/lib/platform/orchestration/context-service';

const MAX_CONTEXT_CHARS = 8_000;
const SECRET_PATTERNS = [
  /\b(?:sk|ghp|github_pat|sbp|xox[baprs])-[-A-Za-z0-9_]{12,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}\b/gi,
  /\b(?:api[_ -]?key|secret|token|password)\s*[:=]\s*[^\s,;]+/gi,
];

function redact(value: string): string {
  let result = value;
  for (const pattern of SECRET_PATTERNS) result = result.replace(pattern, '[REDACTED]');
  return result;
}

/**
 * Compose a small, read-only handoff for an engineering worker. The canonical
 * memory service remains the authority; OpenHands receives only a redacted
 * retrieval summary and provenance labels, never raw memory rows or secrets.
 */
export async function buildOpenHandsContextPrompt(input: {
  goal: string;
  actorId?: string | null;
  tenantId?: string | null;
}): Promise<string> {
  try {
    const context = await loadSharedContext({
      goal: input.goal,
      userId: input.actorId ?? undefined,
      tenantId: input.tenantId ?? undefined,
      workflowLimit: 4,
      memoryLimit: 6,
    });

    const retrieval = redact(context.retrievalContext || '').slice(0, MAX_CONTEXT_CHARS);
    const provenance = Array.from(new Set(context.provenance.map((item) => item.source))).slice(0, 8);

    return [
      'Elevate engineering context (read-only; repository code and current main remain authoritative):',
      'Architectural constraints: preserve canonical planners/routers/tool registries/task tables; re-read current main before edits; do not expose secrets; verify changes with tests.',
      retrieval ? `Relevant retrieved context:\n${retrieval}` : 'No additional retrieval context was available.',
      provenance.length ? `Context provenance: ${provenance.join(', ')}` : 'Context provenance: none',
    ].join('\n\n');
  } catch {
    return [
      'Elevate engineering context:',
      'Repository code and current main are authoritative. Preserve canonical planners/routers/tool registries/task tables, do not expose secrets, and verify changes with tests.',
    ].join('\n\n');
  }
}
