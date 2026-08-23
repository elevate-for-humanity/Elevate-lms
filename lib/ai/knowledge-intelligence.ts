import { aiChat } from './ai-service';

export type KnowledgeMode = 'answer' | 'summarize' | 'compare' | 'actions' | 'risks';

export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  type?: string;
  updatedAt?: string;
  location?: string;
}

export interface KnowledgeRequest {
  mode: KnowledgeMode;
  question: string;
  sources: KnowledgeSource[];
  maxSources?: number;
}

export interface KnowledgeCitation {
  sourceId: string;
  title: string;
}

export interface KnowledgeResult {
  answer: string;
  citations: KnowledgeCitation[];
  sourceIds: string[];
  provider?: string;
  model?: string;
}

const MODE_RULES: Record<KnowledgeMode, string> = {
  answer: 'Answer the question using only the supplied sources.',
  summarize: 'Summarize the supplied sources and preserve material distinctions between them.',
  compare: 'Compare the supplied sources, highlighting agreements, conflicts, version differences, and missing evidence.',
  actions: 'Extract concrete action items, owners, dates, dependencies, and unresolved follow-ups only when explicitly supported by the sources.',
  risks: 'Identify risks, contradictions, missing evidence, stale information, or policy mismatches supported by the supplied sources.',
};

function compactSource(source: KnowledgeSource): KnowledgeSource {
  return {
    ...source,
    content: source.content.slice(0, 18_000),
  };
}

export async function askKnowledge(
  request: KnowledgeRequest,
): Promise<KnowledgeResult> {
  if (!request.sources.length) throw new Error('At least one knowledge source is required');

  const maxSources = Math.max(1, Math.min(request.maxSources || 12, 20));
  const sources = request.sources.slice(0, maxSources).map(compactSource);
  const allowedIds = new Set(sources.map((source) => source.id));

  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: [
          'You are Elevate Knowledge Intelligence for workforce, education, apprenticeship, compliance, CRM, operations, and platform records.',
          MODE_RULES[request.mode],
          'The supplied sources are the only evidence you may use.',
          'Do not fill gaps from memory. If the evidence is missing or conflicting, say so clearly.',
          'Prefer newer source versions when dates are available, but explicitly flag conflicts instead of silently choosing one.',
          'Never infer regulated eligibility, funding approval, compliance, certification, payment status, or completion unless the authoritative source explicitly states it.',
          'Return JSON only in this shape: {"answer":"...","sourceIds":["source-id"]}.',
          'sourceIds must contain only IDs from sources that materially support the answer.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          question: request.question,
          sources,
        }),
      },
    ],
    temperature: 0.15,
    maxTokens: 2600,
  });

  const cleaned = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned) as { answer?: unknown; sourceIds?: unknown };
  const sourceIds = Array.isArray(parsed.sourceIds)
    ? parsed.sourceIds.filter((value): value is string => typeof value === 'string' && allowedIds.has(value))
    : [];

  const citations = sourceIds.map((sourceId) => {
    const source = sources.find((item) => item.id === sourceId)!;
    return { sourceId, title: source.title };
  });

  return {
    answer: typeof parsed.answer === 'string' ? parsed.answer.trim() : '',
    citations,
    sourceIds,
    provider: result.provider,
    model: result.model,
  };
}
