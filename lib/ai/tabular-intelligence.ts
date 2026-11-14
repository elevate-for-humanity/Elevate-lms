import { aiChat } from './ai-service';

export type TabularIntelligenceMode =
  | 'generate'
  | 'summarize'
  | 'categorize'
  | 'sentiment'
  | 'extract';

export type TabularRow = Record<string, unknown>;

export interface TabularIntelligenceRequest {
  mode: TabularIntelligenceMode;
  instruction: string;
  row: TabularRow;
  categories?: string[];
  outputKey?: string;
}

export interface TabularIntelligenceResult {
  value: string;
  mode: TabularIntelligenceMode;
  outputKey?: string;
  provider?: string;
  model?: string;
}

const MODE_RULES: Record<TabularIntelligenceMode, string> = {
  generate: 'Generate concise text from only the supplied row data and instruction.',
  summarize: 'Summarize the supplied row data. Preserve material facts and do not invent missing information.',
  categorize: 'Classify the supplied row into exactly one allowed category when categories are provided. If the evidence is insufficient, return "unclassified".',
  sentiment: 'Classify sentiment as positive, neutral, or negative unless the instruction explicitly requests another fixed label set.',
  extract: 'Extract only the requested fact or field from the supplied row. If absent, return "unknown".',
};

function sanitizeRow(row: TabularRow): TabularRow {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

export async function runTabularIntelligence(
  request: TabularIntelligenceRequest,
): Promise<TabularIntelligenceResult> {
  const row = sanitizeRow(request.row);
  const categoryRule = request.categories?.length
    ? `Allowed categories: ${request.categories.join(', ')}.`
    : '';

  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: [
          'You are Elevate Tabular Intelligence, a structured data assistant for workforce, education, apprenticeship, CRM, compliance, and operational records.',
          MODE_RULES[request.mode],
          categoryRule,
          'Treat the supplied row as the only authoritative record context.',
          'Never approve eligibility, funding, compliance, completion, certification, payment status, or another regulated outcome. You may summarize, flag, classify, or extract evidence for human or deterministic-rule review.',
          'Return plain text only with no markdown fences.',
        ]
          .filter(Boolean)
          .join(' '),
      },
      {
        role: 'user',
        content: `Instruction: ${request.instruction}\n\nRow JSON:\n${JSON.stringify(row)}`,
      },
    ],
    temperature: request.mode === 'generate' ? 0.55 : 0.15,
    maxTokens: request.mode === 'summarize' || request.mode === 'generate' ? 1200 : 400,
  });

  return {
    value: result.content.trim(),
    mode: request.mode,
    outputKey: request.outputKey,
    provider: result.provider,
    model: result.model,
  };
}

export async function runTabularIntelligenceBatch(
  requests: TabularIntelligenceRequest[],
  concurrency = 4,
): Promise<TabularIntelligenceResult[]> {
  const safeConcurrency = Math.max(1, Math.min(concurrency, 8));
  const results: TabularIntelligenceResult[] = new Array(requests.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < requests.length) {
      const index = cursor++;
      results[index] = await runTabularIntelligence(requests[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(safeConcurrency, requests.length) }, () => worker()),
  );

  return results;
}
