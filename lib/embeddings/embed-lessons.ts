/**
 * lib/embeddings/embed-lessons.ts
 *
 * Lesson embedding pipeline.
 * Reads course_lessons, generates OpenAI text-embedding-3-small vectors,
 * upserts into course_embeddings.
 *
 * Usage:
 *   import { embedCourseLessons } from '@/lib/embeddings/embed-lessons';
 *   await embedCourseLessons(db, courseId);
 *
 * Called automatically after lesson creation/update via the Studio tools.
 * Also callable from the admin API for bulk re-embedding.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20; // OpenAI allows up to 2048 inputs per request

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmbedResult {
  embedded: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

// ─── OpenAI embedding call ────────────────────────────────────────────────────

async function getEmbeddings(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'placeholder-build-key' || apiKey === 'sk-placeholder-build-key') {
    return null;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('[embed-lessons] OpenAI embeddings error', undefined, { status: res.status, err });
      return null;
    }

    const data = await res.json() as { data: Array<{ embedding: number[]; index: number }> };
    // Sort by index to preserve order
    return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
  } catch (err) {
    logger.error('[embed-lessons] fetch error', err instanceof Error ? err : undefined);
    return null;
  }
}

// ─── Text builder ─────────────────────────────────────────────────────────────

function buildLessonText(lesson: {
  title: string;
  lesson_type: string;
  content?: string | null;
  learning_objectives?: unknown[] | null;
  quiz_questions?: unknown[] | null;
}): string {
  const parts: string[] = [];

  parts.push(`Title: ${lesson.title}`);
  parts.push(`Type: ${lesson.lesson_type}`);

  if (lesson.learning_objectives && Array.isArray(lesson.learning_objectives)) {
    const objs = lesson.learning_objectives
      .map((o: unknown) => (typeof o === 'string' ? o : (o as { text?: string })?.text ?? ''))
      .filter(Boolean)
      .slice(0, 5);
    if (objs.length) parts.push(`Objectives: ${objs.join('. ')}`);
  }

  if (lesson.content) {
    // Strip HTML tags and truncate
    const text = lesson.content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);
    if (text.length > 50) parts.push(`Content: ${text}`);
  }

  if (lesson.quiz_questions && Array.isArray(lesson.quiz_questions)) {
    const questions = lesson.quiz_questions
      .slice(0, 5)
      .map((q: unknown) => {
        const qObj = q as { question?: string };
        return qObj?.question ?? '';
      })
      .filter(Boolean);
    if (questions.length) parts.push(`Quiz questions: ${questions.join(' | ')}`);
  }

  return parts.join('\n');
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function embedCourseLessons(
  db: SupabaseClient,
  courseId: string,
  options: { force?: boolean } = {},
): Promise<EmbedResult> {
  const start = Date.now();
  let embedded = 0;
  let skipped = 0;
  let errors = 0;

  // Fetch lessons
  const { data: lessons, error: fetchErr } = await db
    .from('course_lessons')
    .select('id, title, lesson_type, content, learning_objectives, quiz_questions, updated_at')
    .eq('course_id', courseId);

  if (fetchErr || !lessons?.length) {
    return { embedded: 0, skipped: 0, errors: 1, durationMs: Date.now() - start };
  }

  // If not forcing, skip lessons that already have embeddings
  let toEmbed = lessons;
  if (!options.force) {
    const { data: existing } = await db
      .from('course_embeddings')
      .select('lesson_id, updated_at')
      .eq('course_id', courseId)
      .not('lesson_id', 'is', null);

    const existingMap = new Map(
      (existing ?? []).map((e: { lesson_id: string; updated_at: string }) => [e.lesson_id, e.updated_at])
    );

    toEmbed = lessons.filter(l => {
      const embeddedAt = existingMap.get(l.id);
      if (!embeddedAt) return true; // not yet embedded
      return new Date(l.updated_at) > new Date(embeddedAt); // lesson updated since last embed
    });

    skipped = lessons.length - toEmbed.length;
  }

  if (!toEmbed.length) {
    return { embedded: 0, skipped, errors: 0, durationMs: Date.now() - start };
  }

  // Process in batches
  for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
    const batch = toEmbed.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildLessonText);

    const vectors = await getEmbeddings(texts);
    if (!vectors) {
      errors += batch.length;
      continue;
    }

    // Upsert embeddings
    const rows = batch.map((lesson, idx) => ({
      course_id: courseId,
      lesson_id: lesson.id,
      content_type: 'lesson',
      source_text: texts[idx].slice(0, 2000),
      embedding: `[${vectors[idx].join(',')}]`, // Supabase expects vector literal
      model: EMBEDDING_MODEL,
      token_count: Math.ceil(texts[idx].length / 4), // rough estimate
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await db
      .from('course_embeddings')
      .upsert(rows, { onConflict: 'course_id,lesson_id,content_type' });

    if (upsertErr) {
      logger.error('[embed-lessons] upsert error', undefined, { error: upsertErr.message });
      errors += batch.length;
    } else {
      embedded += batch.length;
    }
  }

  logger.info('[embed-lessons] complete', {
    courseId,
    embedded,
    skipped,
    errors,
    durationMs: Date.now() - start,
  });

  return { embedded, skipped, errors, durationMs: Date.now() - start };
}

// ─── Semantic search ──────────────────────────────────────────────────────────

export interface SemanticSearchResult {
  lesson_id: string;
  course_id: string;
  source_text: string;
  similarity: number;
}

export async function searchLessons(
  db: SupabaseClient,
  query: string,
  options: { courseId?: string; limit?: number; threshold?: number } = {},
): Promise<SemanticSearchResult[]> {
  const { courseId, limit = 5, threshold = 0.7 } = options;

  const vectors = await getEmbeddings([query]);
  if (!vectors) return [];

  const vectorLiteral = `[${vectors[0].join(',')}]`;

  // Use the match_lessons RPC — proper pgvector cosine similarity via Supabase JS client
  const { data, error } = await db.rpc('match_lessons', {
    query_embedding: vectorLiteral,
    match_threshold: threshold,
    match_count: limit,
    filter_course_id: courseId ?? null,
  });

  if (error) {
    logger.error('[embed-lessons] searchLessons error', undefined, { error: error.message });
    return [];
  }
  return (data ?? []) as SemanticSearchResult[];
}
