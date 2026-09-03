/**
 * lib/platform/rag-seeder.ts
 *
 * Callable module for embedding platform knowledge into pgvector.
 * Used by:
 *   - scripts/embed-platform-knowledge.ts (CLI)
 *   - apps/admin/app/api/cron/embed-knowledge/route.ts (weekly cron)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  SYSTEMS,
  PLATFORM_DEBT,
  CANONICAL_DECISIONS,
  ROUTE_DEPENDENCIES,
} from '@/lib/platform/knowledge-graph';
import { logger } from '@/lib/logger';

const ROOT = process.cwd();

interface Chunk {
  source_type: string;
  source_path: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface EmbedOptions {
  source?: 'all' | 'graph' | 'routes' | 'migrations' | 'docs' | 'lib';
  dryRun?: boolean;
}

interface EmbedResult {
  written: number;
  errors: number;
  total: number;
  dryRun: boolean;
}

async function embed(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI embed failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

function buildKnowledgeGraphChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  for (const system of SYSTEMS) {
    chunks.push({
      source_type: 'system',
      source_path: `lib/platform/knowledge-graph.ts#${system.id}`,
      title: system.name,
      content: [
        `System: ${system.name} (${system.id})`,
        `Status: ${system.status}`,
        `Description: ${system.description}`,
        `Routes: ${system.routes.join(', ')}`,
        `DB Tables: ${system.tables.join(', ')}`,
        `APIs: ${system.apis.join(', ')}`,
      ].join('\n'),
      metadata: { system_id: system.id, status: system.status },
    });
  }

  for (const debt of PLATFORM_DEBT) {
    chunks.push({
      source_type: 'debt',
      source_path: `lib/platform/knowledge-graph.ts#debt-${debt.id}`,
      title: `Platform Debt: ${debt.id}`,
      content: [
        `Issue: ${debt.id}`,
        `Severity: ${debt.severity}`,
        `Description: ${debt.description}`,
        `Resolution: ${debt.resolution}`,
        debt.affectedRoutes.length ? `Affected routes: ${debt.affectedRoutes.join(', ')}` : '',
      ].filter(Boolean).join('\n'),
      metadata: { severity: debt.severity },
    });
  }

  for (const decision of CANONICAL_DECISIONS) {
    chunks.push({
      source_type: 'decision',
      source_path: `lib/platform/knowledge-graph.ts#decision-${decision.id}`,
      title: `Canonical Decision: ${decision.id}`,
      content: [`Decision: ${decision.decision}`, `Rationale: ${decision.rationale}`].join('\n'),
      metadata: { decision_id: decision.id },
    });
  }

  for (const [route, deps] of Object.entries(ROUTE_DEPENDENCIES)) {
    chunks.push({
      source_type: 'route',
      source_path: route,
      title: `Route: ${route}`,
      content: [
        `Route: ${route}`,
        `DB Tables: ${deps.tables.join(', ')}`,
        `APIs: ${deps.apis.join(', ')}`,
        `Components: ${deps.components.join(', ')}`,
      ].join('\n'),
      metadata: { route },
    });
  }

  return chunks;
}

function buildMigrationChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  const migrationsDir = join(ROOT, 'supabase', 'migrations');
  if (!existsSync(migrationsDir)) return chunks;

  for (const f of readdirSync(migrationsDir).sort()) {
    if (!f.endsWith('.sql')) continue;
    const sql = readFileSync(join(migrationsDir, f), 'utf8');
    const tables = [...sql.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)/gi)].map(
      (m) => m[1],
    );
    const comments = sql
      .split('\n')
      .filter((l) => l.trim().startsWith('--'))
      .slice(0, 10)
      .map((l) => l.replace(/^--\s*/, ''))
      .join(' ');

    chunks.push({
      source_type: 'migration',
      source_path: `supabase/migrations/${f}`,
      title: `Migration: ${f}`,
      content: [
        `Migration: ${f}`,
        comments ? `Description: ${comments}` : '',
        tables.length ? `Creates tables: ${tables.join(', ')}` : '',
        `SQL preview:\n${sql.slice(0, 400)}`,
      ]
        .filter(Boolean)
        .join('\n'),
      metadata: { filename: f, tables },
    });
  }

  return chunks;
}

/**
 * Seed API route files from app/ and apps/admin/app/api/.
 * Extracts the first JSDoc comment block + export signatures so the AI
 * understands what each endpoint does without embedding full implementations.
 */
function buildRouteChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  const routeDirs = [
    join(ROOT, 'app', 'api'),
    join(ROOT, 'apps', 'admin', 'app', 'api'),
  ];

  function walkRoutes(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) { walkRoutes(full); continue; }
      if (entry !== 'route.ts' && entry !== 'route.tsx') continue;

      const rel = relative(ROOT, full);
      const content = readFileSync(full, 'utf8');

      // Extract leading JSDoc block (/** ... */)
      const jsdocMatch = content.match(/^\/\*\*([\s\S]*?)\*\//);
      const jsdoc = jsdocMatch ? jsdocMatch[1].replace(/^\s*\*\s?/gm, '').trim() : '';

      // Extract HTTP method exports (export async function GET/POST/PUT/DELETE/PATCH)
      const methods = [...content.matchAll(/^export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/gm)]
        .map((m) => m[1]);

      // Extract runtime/maxDuration declarations
      const runtimeMatch = content.match(/export const runtime\s*=\s*['"](\w+)['"]/);
      const durationMatch = content.match(/export const maxDuration\s*=\s*(\d+)/);

      const summary = [
        `Route: ${rel}`,
        methods.length ? `Methods: ${methods.join(', ')}` : '',
        runtimeMatch ? `Runtime: ${runtimeMatch[1]}` : '',
        durationMatch ? `Max duration: ${durationMatch[1]}s` : '',
        jsdoc ? `\nDescription:\n${jsdoc.slice(0, 600)}` : '',
      ].filter(Boolean).join('\n');

      if (summary.length < 30) continue; // skip empty stubs

      chunks.push({
        source_type: 'route',
        source_path: rel,
        title: `API Route: ${rel}`,
        content: summary,
        metadata: { methods, runtime: runtimeMatch?.[1] ?? 'edge' },
      });
    }
  }

  for (const dir of routeDirs) walkRoutes(dir);
  return chunks;
}

/**
 * Seed key lib/ modules so the AI understands canonical patterns,
 * utility functions, and architectural decisions embedded in code.
 * Only seeds files with a leading JSDoc block — skips implementation-only files.
 */
function buildLibChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  // High-value lib directories to seed
  const seedDirs = [
    'lib/ai',
    'lib/platform',
    'lib/resilience',
    'lib/supabase',
    'lib/admin',
    'lib/governance',
    'lib/compliance',
    'lib/enrollment',
    'lib/lms',
    'lib/auth',
  ];

  const SKIP_PATTERNS = [
    /\.test\./,
    /\.spec\./,
    /node_modules/,
    /\.next/,
    /providers\//,  // individual AI provider impls — too verbose
  ];

  for (const seedDir of seedDirs) {
    const dir = join(ROOT, seedDir);
    if (!existsSync(dir)) continue;

    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) continue;
      if (extname(entry) !== '.ts' && extname(entry) !== '.tsx') continue;
      if (SKIP_PATTERNS.some((p) => p.test(full))) continue;

      const rel = relative(ROOT, full);
      const content = readFileSync(full, 'utf8');

      // Only seed files that have a leading JSDoc block — signals intentional documentation
      const jsdocMatch = content.match(/^\/\*\*([\s\S]*?)\*\//);
      if (!jsdocMatch) continue;
      const jsdoc = jsdocMatch[1].replace(/^\s*\*\s?/gm, '').trim();
      if (jsdoc.length < 20) continue;

      // Extract exported function/class/const names
      const exports = [...content.matchAll(/^export\s+(?:async\s+)?(?:function|class|const|type|interface)\s+(\w+)/gm)]
        .map((m) => m[1])
        .slice(0, 20);

      chunks.push({
        source_type: 'lib',
        source_path: rel,
        title: `Library: ${rel}`,
        content: [
          `Module: ${rel}`,
          exports.length ? `Exports: ${exports.join(', ')}` : '',
          `\nDocumentation:\n${jsdoc.slice(0, 800)}`,
        ].filter(Boolean).join('\n'),
        metadata: { module: rel, exports },
      });
    }
  }

  return chunks;
}

function buildDocChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  const docsDir = join(ROOT, 'docs');
  if (!existsSync(docsDir)) return chunks;

  function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!f.endsWith('.md') && !f.endsWith('.mdx')) continue;

      const content = readFileSync(full, 'utf8');
      const rel = relative(ROOT, full);
      const sections = content.split(/^#{1,3} /m).filter(Boolean);

      for (const section of sections.slice(0, 10)) {
        const lines = section.split('\n');
        const heading = lines[0].trim();
        const body = lines.slice(1).join('\n').trim().slice(0, 800);
        if (!body) continue;

        chunks.push({
          source_type: 'doc',
          source_path: rel,
          title: `Doc: ${rel} — ${heading}`,
          content: `${heading}\n\n${body}`,
          metadata: { file: rel, heading },
        });
      }
    }
  }

  walk(docsDir);
  return chunks;
}

/**
 * Embed platform knowledge into pgvector.
 * Safe to call from API routes — returns a result object instead of exiting.
 */
export async function embedPlatformKnowledge(options: EmbedOptions = {}): Promise<EmbedResult> {
  const { source = 'all', dryRun = false } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && !dryRun) throw new Error('OPENAI_API_KEY is required');

  const supabase = await requireAdminClient();

  const allChunks: Chunk[] = [];
  if (source === 'all' || source === 'graph')      allChunks.push(...buildKnowledgeGraphChunks());
  if (source === 'all' || source === 'routes')     allChunks.push(...buildRouteChunks());
  if (source === 'all' || source === 'lib')        allChunks.push(...buildLibChunks());
  if (source === 'all' || source === 'migrations') allChunks.push(...buildMigrationChunks());
  if (source === 'all' || source === 'docs')       allChunks.push(...buildDocChunks());

  if (dryRun) {
    return { written: 0, errors: 0, total: allChunks.length, dryRun: true };
  }

  const BATCH = 20;
  let written = 0;
  let errors = 0;

  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);

    const rows = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const embedding = await embed(`${chunk.title}\n\n${chunk.content}`, apiKey!);
          return { ...chunk, embedding };
        } catch (err) {
          errors++;
          logger.warn('[rag-seeder] embed failed', { title: chunk.title, error: String(err) });
          return null;
        }
      }),
    );

    const valid = rows.filter(Boolean);
    if (valid.length > 0) {
      const { error } = await supabase
        .from('platform_knowledge_chunks')
        .upsert(valid, { onConflict: 'source_path' });

      if (error) {
        logger.error('[rag-seeder] upsert failed', error);
        errors += valid.length;
      } else {
        written += valid.length;
      }
    }

    // Rate limit: ~3 req/s
    if (i + BATCH < allChunks.length) await new Promise((r) => setTimeout(r, 350));
  }

  logger.info('[rag-seeder] complete', { written, errors, total: allChunks.length });
  return { written, errors, total: allChunks.length, dryRun: false };
}
