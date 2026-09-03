/**
 * RAG (Retrieval-Augmented Generation) helper
 *
 * Retrieves relevant platform knowledge chunks from pgvector before
 * the AI answers. Injected into the system prompt so the model reasons
 * from actual platform structure rather than hallucinating.
 *
 * Requires:
 *   OPENAI_API_KEY          — for text-embedding-3-small
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — for pgvector search
 *
 * Falls back gracefully (returns '') when either is missing or the
 * platform_knowledge_chunks table doesn't exist yet.
 */

import { logger } from '@/lib/logger';

interface KnowledgeChunk {
  id: string;
  source_type: string;
  source_path: string;
  title: string;
  content: string;
  similarity: number;
}

/**
 * Embed a query string using OpenAI text-embedding-3-small.
 * Returns null if OpenAI is not configured.
 */
async function embedQuery(query: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query.slice(0, 2000),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { data: { embedding: number[] }[] };
    return data.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/**
 * Retrieve the top-k most relevant knowledge chunks for a query.
 * Returns formatted context string for injection into system prompt.
 *
 * @param query     The user's question or command
 * @param topK      Number of chunks to retrieve (default 5)
 * @param threshold Minimum cosine similarity (default 0.65)
 */
export async function retrieveContext(
  query: string,
  topK = 5,
  threshold = 0.65,
): Promise<string> {
  try {
    const embedding = await embedQuery(query);
    if (!embedding) return '';

    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return '';

    // Call the search_platform_knowledge RPC
    const res = await fetch(`${url}/rest/v1/rpc/search_platform_knowledge`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: topK,
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return '';
    const chunks = await res.json() as KnowledgeChunk[];
    if (!chunks?.length) return '';

    const lines = [
      '## Relevant Platform Knowledge (retrieved via RAG)',
      '',
      ...chunks.map(c =>
        `### ${c.title} [${c.source_type}] (similarity: ${c.similarity.toFixed(2)})\n${c.content.slice(0, 600)}`
      ),
      '',
    ];
    return lines.join('\n');
  } catch (err) {
    logger.warn('[rag] retrieveContext failed', err);
    return '';
  }
}

/**
 * Retrieve context and format it for injection into a system prompt.
 * Returns empty string on any failure — never throws.
 */
export async function getRAGContext(query: string): Promise<string> {
  const ctx = await retrieveContext(query);
  return ctx;
}
