import 'server-only';

import { loadSharedContext } from '@/lib/platform/orchestration/context-service';

const MAX_CONTEXT_CHARS = 8_000;
const DESIGN_INTENT =
  /\b(design|layout|visual|responsive|mobile|hero|banner|brand|typography|spacing|component|accessibility|wcag|focus|contrast|screenshot)\b/i;
const SECRET_PATTERNS = [
  /\b(?:sk|ghp|github_pat|sbp|xox[baprs])-[-A-Za-z0-9_]{12,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/-]{12,}\b/gi,
  /\b(?:api[_ -]?key|secret|token|password)\s*[:=]\s*[^\s,;]+/gi,
];

function redact(value: string): string {
  let result = value;
  for (const pattern of SECRET_PATTERNS) result = result.replace(pattern, '[REDACTED]');
  return result;
}

export function elevateDesignExecutionContext(goal: string): string | null {
  if (!DESIGN_INTENT.test(goal)) return null;

  return [
    'Elevate visual-execution contract:',
    '- Preserve the existing Elevate identity; do not imitate another product or replace the site with a generic template.',
    '- Reuse canonical shared primitives and tokens before creating a component. Inspect lib/page-design-tokens, components/hero, components/ui, components/programs, and config/efhImageMap.ts.',
    '- Use governed Elevate-owned or licensed imagery. Do not introduce hot-linked stock photography or unverified assets.',
    '- Verify every affected surface at mobile, tablet, desktop, and large-desktop widths. Check clipping, overlap, empty gaps, focus order, reduced motion, contrast, and readable text scaling.',
    '- Run node scripts/design-enforcer.mjs --strict, node scripts/check-home-visual-integrity.mjs when homepage/shared hero code changes, and node scripts/audit-visual-layout.mjs.',
    '- Use the isolated Studio Chromium runtime for live screenshots, console/network evidence, and keyboard checks. Code presence alone is not visual proof.',
    '- Repair shared architecture when a defect affects multiple pages. Do not mask defects with page-specific offsets, fixed heights, or duplicated components.',
    '- Report changed files, viewport evidence, accessibility evidence, test results, commit, deployment revision, and remaining manual-review items.',
  ].join('\n');
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
  const designContext = elevateDesignExecutionContext(input.goal);
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
      designContext,
      retrieval ? `Relevant retrieved context:\n${retrieval}` : 'No additional retrieval context was available.',
      provenance.length ? `Context provenance: ${provenance.join(', ')}` : 'Context provenance: none',
    ].filter(Boolean).join('\n\n');
  } catch {
    return [
      'Elevate engineering context:',
      'Repository code and current main are authoritative. Preserve canonical planners/routers/tool registries/task tables, do not expose secrets, and verify changes with tests.',
      designContext,
    ].filter(Boolean).join('\n\n');
  }
}
