/**
 * Staged ingestion helpers for large documents.
 *
 * Netlify hard limit: 60s per request.
 * Safe budget breakdown:
 *   - File parse:        ~2s
 *   - Chunk summarize:   ~3s per chunk × max 4 chunks = ~12s
 *   - Final extraction:  ~25s (gpt-4o, 8k tokens)
 *   - Overhead/network:  ~8s
 *   Total safe budget:   ~47s — leaves 13s margin
 *
 * For inputs that exceed the safe budget (>50k chars extracted),
 * we persist the summarized intermediate text to job_queue and
 * return a resumable draft ID. The client can poll and resume.
 *
 * Limits:
 *   SAFE_CHARS:    50,000 chars — process synchronously
 *   MAX_CHARS:     80,000 chars — hard reject (enforced in route)
 *   MAX_CHUNKS:    4 chunks of 12,000 chars each
 *   MAX_PAGES_OCR: 8 pages — OCR only first N pages of scanned PDFs
 */

import { getOpenAIClient } from '@/lib/openai-client';
import { getAdminClient } from '@/lib/supabase/admin';

export const SAFE_CHARS = 50_000;
export const MAX_CHARS = 80_000;
export const MAX_CHUNKS = 4;
export const CHUNK_SIZE = 12_000;

export type IngestionStage = 'pending' | 'summarizing' | 'summarized' | 'extracting' | 'done' | 'failed';

export interface IngestionDraft {
  job_id: string;
  stage: IngestionStage;
  summarized_text?: string;
  source_type: string;
  course_mode: string;
  program_id: string | null;
  certificate_enabled: boolean;
  original_char_count: number;
  chunk_count: number;
  warnings: string[];
}

/** Chunk text at paragraph boundaries */
export function chunkText(text: string, maxChars = CHUNK_SIZE): string[] {
  if (text.length <= maxChars) return [text];
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Summarize a single chunk via gpt-4o-mini */
async function summarizeChunk(openai: ReturnType<typeof getOpenAIClient>, chunk: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Summarize the key topics, structure, and learning content from this section. Preserve all topic names, objectives, section headings, and any assessment cues.\n\n${chunk}`,
    }],
    temperature: 0.2,
    max_tokens: 1200,
  });
  return res.choices[0].message.content || chunk.slice(0, 1500);
}

/**
 * Summarize all chunks and return combined text.
 * For inputs within SAFE_CHARS, returns the original text unchanged.
 * For larger inputs, summarizes up to MAX_CHUNKS chunks.
 */
export async function summarizeForExtraction(
  text: string,
  openai: ReturnType<typeof getOpenAIClient>
): Promise<{ summarizedText: string; chunkCount: number; wasChunked: boolean }> {
  if (text.length <= SAFE_CHARS) {
    return { summarizedText: text, chunkCount: 1, wasChunked: false };
  }

  const chunks = chunkText(text, CHUNK_SIZE).slice(0, MAX_CHUNKS);
  const summaries: string[] = [];

  for (const chunk of chunks) {
    summaries.push(await summarizeChunk(openai, chunk));
  }

  return {
    summarizedText: summaries.join('\n\n---\n\n'),
    chunkCount: chunks.length,
    wasChunked: true,
  };
}

/** Persist an ingestion draft to job_queue for resumable processing */
export async function persistIngestionDraft(draft: Omit<IngestionDraft, 'job_id'>): Promise<string> {
  const db = await getAdminClient();
  if (!db) throw new Error('Database unavailable');

  const { data, error } = await db
    .from('job_queue')
    .insert({
      type: 'course_ingestion',
      status: draft.stage,
      payload: draft,
      max_attempts: 3,
      attempts: 0,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error('Failed to persist ingestion draft');
  return data.id;
}

/** Load an existing ingestion draft from job_queue */
export async function loadIngestionDraft(jobId: string): Promise<IngestionDraft | null> {
  const db = await getAdminClient();
  if (!db) return null;

  const { data } = await db
    .from('job_queue')
    .select('id, payload, status')
    .eq('id', jobId)
    .eq('type', 'course_ingestion')
    .single();

  if (!data) return null;
  return { ...(data.payload as IngestionDraft), job_id: data.id, stage: data.status as IngestionStage };
}

/** Update stage on an existing draft */
export async function updateIngestionDraftStage(
  jobId: string,
  stage: IngestionStage,
  patch: Partial<IngestionDraft> = {}
): Promise<void> {
  const db = await getAdminClient();
  if (!db) return;

  const { data: existing } = await db
    .from('job_queue')
    .select('payload')
    .eq('id', jobId)
    .single();

  await db
    .from('job_queue')
    .update({
      status: stage,
      payload: { ...(existing?.payload || {}), ...patch, stage },
      processed_at: stage === 'done' || stage === 'failed' ? new Date().toISOString() : null,
    })
    .eq('id', jobId);
}
