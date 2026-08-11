import 'server-only';

import * as mammoth from 'mammoth';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

type Citation = Record<string, unknown>;
type ResponseBlock = {
  type?: string;
  text?: string;
  citations?: Citation[];
};

type ClaudeResponse = {
  model?: string;
  content?: ResponseBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
};

export type WorkforceDocumentAnalysis = {
  text: string;
  structured: Record<string, unknown> | null;
  citations: Citation[];
  model: string;
  usage: { inputTokens: number; outputTokens: number };
};

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        const parsed = JSON.parse(cleaned.slice(first, last + 1));
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function documentBlock(fileName: string, mimeType: string, bytes: Buffer): Promise<Record<string, unknown>> {
  if (mimeType === 'application/pdf') {
    return {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: bytes.toString('base64'),
      },
      title: fileName,
      context: 'Workforce, education, credentialing, employer, participant, or compliance document supplied by an authenticated Elevate administrator.',
      citations: { enabled: true },
    };
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const extracted = await mammoth.extractRawText({ buffer: bytes });
    return {
      type: 'document',
      source: { type: 'text', media_type: 'text/plain', data: extracted.value.slice(0, 500_000) },
      title: fileName,
      citations: { enabled: true },
    };
  }

  if (mimeType.startsWith('text/')) {
    return {
      type: 'document',
      source: { type: 'text', media_type: 'text/plain', data: bytes.toString('utf8').slice(0, 500_000) },
      title: fileName,
      citations: { enabled: true },
    };
  }

  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
    return {
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data: bytes.toString('base64') },
    };
  }

  throw new Error('Unsupported document type.');
}

export async function analyzeWorkforceDocument(params: {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  instructions?: string;
}): Promise<WorkforceDocumentAnalysis> {
  const credential = process.env.ANTHROPIC_API_KEY?.trim();
  if (!credential) throw new Error('ANTHROPIC_API_KEY not configured');

  const sourceBlock = await documentBlock(params.fileName, params.mimeType, params.bytes);
  const prompt = `Analyze this document for Elevate workforce/case-management operations.
Extract facts only. Do not invent missing data and do not make a final legal, funding, medical, or eligibility determination.
Return JSON with these keys when applicable:
{
  "documentType": string,
  "participant": {"name": string|null, "email": string|null, "phone": string|null},
  "employment": {"employer": string|null, "jobTitle": string|null, "hoursWorked": number|null, "startDate": string|null, "endDate": string|null},
  "credentials": [{"name": string, "issuer": string|null, "date": string|null, "identifier": string|null}],
  "milestones": [{"name": string, "date": string|null, "value": string|null}],
  "eligibilitySignals": [{"signal": string, "value": string, "source": string}],
  "missingFields": [string],
  "discrepancies": [string],
  "complianceFlags": [string],
  "recommendedHumanReview": [string],
  "summary": string
}
Use document citations when the source supports them. ${params.instructions?.trim() ? `Additional admin instruction: ${params.instructions.trim().slice(0, 4000)}` : ''}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': credential,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_DOCUMENT_MODEL?.trim() || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
      max_tokens: 3500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [sourceBlock, { type: 'text', text: prompt }],
        },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const payload = (await response.json().catch(() => ({}))) as ClaudeResponse;
  if (!response.ok) {
    throw new Error(`Anthropic document analysis failed (${response.status}): ${payload.error?.message || 'unknown error'}`);
  }

  const text = (payload.content ?? [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim();
  const citations = (payload.content ?? []).flatMap((block) => Array.isArray(block.citations) ? block.citations : []);

  return {
    text,
    structured: extractJson(text),
    citations,
    model: payload.model || DEFAULT_MODEL,
    usage: {
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0,
    },
  };
}
