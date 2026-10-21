import { PARIS_SYSTEM_IDENTITY } from '@/lib/ai/paris-identity';
import { getKnowledgeGraphContext } from '@/lib/platform/knowledge-graph';
import { getSystemRegistryContext } from '@/lib/platform/system-registry';

export interface AdminAiPromptContext {
  agent?: 'ADMIN_AI';
  contextProfile?: 'full' | 'owned-cpu';
  institutionalContext?: string;
  ragContext?: string;
  fileContext?: string;
  documentsContext?: string;
  toolInventory?: string[];
  automaticEvidence?: string;
  lastUserMessage?: string;
}

const DIAGNOSTIC_TERMS = [
  'broken',
  'bug',
  'diagnose',
  'debug',
  'error',
  'failing',
  'failure',
  'hallucinat',
  'inspect',
  'investigate',
  'missing',
  'not working',
  'problem',
  'root cause',
  'why',
];

export function isOperationalDiagnosticRequest(message: string): boolean {
  const normalized = message.toLowerCase();
  return DIAGNOSTIC_TERMS.some((term) => normalized.includes(term));
}

const OWNED_PROMPT_MAX_CHARACTERS = 12_000;

function relevantReferenceLines(context: string, query: string): string {
  const ignored = new Set(['the', 'this', 'that', 'with', 'from', 'have', 'will', 'please', 'hello', 'there', 'what', 'when', 'where', 'about', 'could', 'would', 'should', 'your', 'does', 'using', 'them', 'then']);
  const terms = [...new Set(query.toLowerCase().match(/[a-z][a-z0-9_-]{2,}/g) ?? [])].filter(term => !ignored.has(term));
  const lines = context.split('\n').filter(line => terms.some(term => line.toLowerCase().includes(term)));
  return lines.length ? 'Matched canonical reference lines (partial):\n' + lines.join('\n') : 'Detailed catalog omitted. Retrieve relevant canonical evidence with the listed tools when needed.';
}

function contextExcerpt(value: string, limit: number): string {
  if (value.length <= limit) return value;
  if (limit <= 0) return '';
  const marker = '\n[Partial context; middle omitted.]\n';
  if (limit <= marker.length) return value.slice(0, limit);
  const head = Math.ceil((limit - marker.length) / 2);
  const tail = limit - marker.length - head;
  return value.slice(0, head) + marker + (tail > 0 ? value.slice(-tail) : '');
}

export function buildAdminAiSystemPrompt({
  ragContext,
  institutionalContext,
  fileContext,
  documentsContext,
  toolInventory = [],
  automaticEvidence,
  lastUserMessage = '',
  contextProfile = 'full',
}: AdminAiPromptContext): string {
  const diagnosticMode = isOperationalDiagnosticRequest(lastUserMessage);

  const role =
    'unified platform orchestrator for architecture, development, debugging, QA, DevOps, websites, courses, workflows, business operations, administration, and compliance';

  const compact = contextProfile === 'owned-cpu';
  const graph = getKnowledgeGraphContext();
  const registry = getSystemRegistryContext();
  const context = {
    graph: compact ? relevantReferenceLines(graph, lastUserMessage) : graph,
    registry: compact ? relevantReferenceLines(registry, lastUserMessage) : registry,
    rag: ragContext || 'No semantic RAG chunks were retrieved for this request.',
    evidence: automaticEvidence || 'No automatic evidence was collected before this model call.',
    file: fileContext || 'No file currently open.',
    documents: documentsContext || 'No uploaded documents available.',
  };
  const render = (sections: typeof context) => `${PARIS_SYSTEM_IDENTITY}\n\nYou are the ${role} inside Elevate LMS Dev Studio.
All registered Studio agents are internal capabilities behind this one identity. Select and combine the required capabilities automatically; never ask the administrator to choose an agent or workspace. Cite actual evidence and never pretend a tool ran.

Platform stack: Next.js App Router, Supabase, TypeScript, Tailwind, Google Cloud Run.

## Non-negotiable evidence rules
- Never claim to have investigated, checked, queried, inspected, searched, verified, or confirmed anything unless a tool result or supplied context proves it.
- Do not say "I don't have direct access" as a generic escape hatch. State the exact missing evidence instead.
- If you did not use a live/read-only tool, say "No live tool was executed for this answer" before any diagnosis.
- If context is incomplete, still reason from known architecture, but label the result as a hypothesis and name the files/routes/tables to inspect next.
- Prefer concrete technical hypotheses over support-style suggestions.
- Do not give vague advice like "check curriculum tools" when route, table, or component names are available.
- For live data, include which tool produced the evidence.
- Only a successful scan_live_page result proves browser, console, network, responsive-layout, or live accessibility behavior. Registry and source-code inspection do not prove those outcomes.
- When scan_live_page returns status "failed" or verified false, report the browser audit as failed and do not convert the failure into a clean bill of health.

## Diagnostic response contract
${diagnosticMode ? 'For this request, use this exact structure:' : 'For diagnostic or debugging requests, use this exact structure:'}
Problem:
Evidence used:
Likely causes:
Affected files/routes/tables:
Confidence:
Next debug step:

## Canonical architecture rules
- Admin operations live at https://admin.elevateforhumanity.org. Never audit an admin route such as /dashboard, /studio, /students, /applications, /programs, /settings, or /system-health on the public www host.
- Public marketing pages live at https://www.elevateforhumanity.org. Preserve the exact hostname supplied by the administrator and do not silently substitute another Elevate application.
- Public program pages use /programs/[program] unless a unique client component is required.
- LMS delivery uses /lms/courses/[courseId]/lessons/[lessonId] and the DB-driven course engine.
- Supabase imports must come from @/lib/supabase/*.
- Middleware logic belongs in proxy.ts only; never create middleware.ts.
- API auth uses apiAuthGuard, apiRequireAdmin, or apiRequireInstructor from @/lib/admin/guards.
- API errors use safeError, safeInternalError, or safeDbError from @/lib/api/safe-error.
- Rate limiting uses applyRateLimit() from @/lib/api/withRateLimit.
- Hero banners must use components/marketing/HeroVideo.tsx with content defined in content/heroBanners.ts.

## Available read-only tools
${toolInventory.length ? toolInventory.map((tool) => `- ${tool}`).join('\n') : '- No tool inventory supplied'}

${institutionalContext ? '## AI Studio Charter\n' + institutionalContext + '\n' : ''}

## Platform knowledge graph
${sections.graph}

## Program/system registry
${sections.registry}

## Retrieved RAG context
${sections.rag}

## Automatic evidence collected before model call
${sections.evidence}

## Current file context
${sections.file}

## Uploaded documents context
${sections.documents}

${compact ? 'Reference sections may be excerpted or omitted to fit the private model. Missing or partial context is not evidence of success. Retrieve complete evidence before making consequential claims or changes.' : ''}
Be concise, technical, and explicit about evidence boundaries.`;

  if (!compact) return render(context);
  const bounded = { graph: '', registry: '', rag: '', evidence: '', file: '', documents: '' };
  let remaining = Math.max(0, OWNED_PROMPT_MAX_CHARACTERS - render(bounded).length);
  // Keep institutional and observed evidence context ahead of broad catalogs.
  // The user request and conversation messages are never truncated here.
  const priorities: Array<[keyof typeof context, number]> = [
    ['rag', 4000], ['evidence', 2500], ['file', 1800], ['documents', 1800], ['graph', 1200], ['registry', 1200],
  ];
  for (const [key, cap] of priorities) {
    bounded[key] = contextExcerpt(context[key], Math.min(cap, remaining));
    remaining -= bounded[key].length;
  }
  return render(bounded);
}
