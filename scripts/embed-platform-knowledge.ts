#!/usr/bin/env tsx
/**
 * scripts/embed-platform-knowledge.ts
 *
 * Embeds platform knowledge into Supabase pgvector for RAG retrieval.
 *
 * Sources:
 *   - lib/platform/knowledge-graph.ts  (systems, routes, tables, debt, decisions)
 *   - app/ route tree                  (page.tsx and route.ts paths)
 *   - supabase/migrations/             (migration descriptions)
 *   - docs/                            (markdown docs)
 *   - programs table                   (live program descriptions from DB)
 *
 * Usage:
 *   pnpm tsx scripts/embed-platform-knowledge.ts
 *   pnpm tsx scripts/embed-platform-knowledge.ts --source routes
 *   pnpm tsx scripts/embed-platform-knowledge.ts --dry-run
 *
 * Requires:
 *   OPENAI_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  SYSTEMS,
  PLATFORM_DEBT,
  CANONICAL_DECISIONS,
  ROUTE_DEPENDENCIES,
} from '../lib/platform/knowledge-graph';

// ── Config ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
// Strip flags before resolving source filter so --dry-run doesn't pollute it
const nonFlagArgs = args.filter(a => !a.startsWith('--'));
const SOURCE_FILTER = args.find(a => a.startsWith('--source='))?.split('=')[1]
  ?? (args.includes('--source') ? args[args.indexOf('--source') + 1] : undefined)
  ?? nonFlagArgs[0]
  ?? 'all';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY   = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}
if (!OPENAI_KEY && !DRY_RUN) {
  console.error('❌  OPENAI_API_KEY is required (or use --dry-run)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Types ────────────────────────────────────────────────────────────────────

interface Chunk {
  source_type: string;
  source_path: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

// ── Embedding ────────────────────────────────────────────────────────────────

async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // token limit safety
    }),
  });
  if (!res.ok) throw new Error(`OpenAI embed failed: ${res.status} ${await res.text()}`);
  const data = await res.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

// ── Chunk builders ───────────────────────────────────────────────────────────

function buildKnowledgeGraphChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  // Systems
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

  // Platform debt
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

  // Canonical decisions
  for (const decision of CANONICAL_DECISIONS) {
    chunks.push({
      source_type: 'decision',
      source_path: `lib/platform/knowledge-graph.ts#decision-${decision.id}`,
      title: `Canonical Decision: ${decision.id}`,
      content: [
        `Decision: ${decision.decision}`,
        `Rationale: ${decision.rationale}`,
      ].join('\n'),
      metadata: { decision_id: decision.id },
    });
  }

  // Route dependencies
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

function buildRouteChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  const appDir = join(ROOT, 'app');

  function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (f !== 'page.tsx' && f !== 'route.ts') continue;

      const rel = relative(appDir, full);
      const routePath = '/' + rel.replace(/\/page\.tsx$/, '').replace(/\/route\.ts$/, '');
      const type = f === 'page.tsx' ? 'page' : 'api';

      // Read first 50 lines for context
      const src = readFileSync(full, 'utf8').split('\n').slice(0, 50).join('\n');

      chunks.push({
        source_type: type,
        source_path: routePath,
        title: `${type === 'page' ? 'Page' : 'API'}: ${routePath}`,
        content: [
          `${type === 'page' ? 'Page route' : 'API route'}: ${routePath}`,
          `File: app/${rel}`,
          `Preview:\n${src.slice(0, 500)}`,
        ].join('\n'),
        metadata: { route: routePath, file: `app/${rel}` },
      });
    }
  }

  walk(appDir);
  return chunks;
}

function buildMigrationChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  const migrationsDir = join(ROOT, 'supabase', 'migrations');

  for (const f of readdirSync(migrationsDir).sort()) {
    if (!f.endsWith('.sql')) continue;
    const full = join(migrationsDir, f);
    const sql = readFileSync(full, 'utf8');

    // Extract table names and comments
    const tables = [...sql.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)/gi)]
      .map(m => m[1]);
    const comments = sql.split('\n')
      .filter(l => l.trim().startsWith('--'))
      .slice(0, 10)
      .map(l => l.replace(/^--\s*/, ''))
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
      ].filter(Boolean).join('\n'),
      metadata: { filename: f, tables },
    });
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

      // Split into sections by heading
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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧠  Elevate Platform Knowledge Embedder`);
  console.log(`   Source filter: ${SOURCE_FILTER}`);
  console.log(`   Dry run: ${DRY_RUN}\n`);

  const allChunks: Chunk[] = [];

  if (SOURCE_FILTER === 'all' || SOURCE_FILTER === 'graph') {
    const chunks = buildKnowledgeGraphChunks();
    console.log(`   Knowledge graph: ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  if (SOURCE_FILTER === 'all' || SOURCE_FILTER === 'routes') {
    const chunks = buildRouteChunks();
    console.log(`   Routes: ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  if (SOURCE_FILTER === 'all' || SOURCE_FILTER === 'migrations') {
    const chunks = buildMigrationChunks();
    console.log(`   Migrations: ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  if (SOURCE_FILTER === 'all' || SOURCE_FILTER === 'docs') {
    const chunks = buildDocChunks();
    console.log(`   Docs: ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  // Deduplicate across all sources — last source wins on source_path collision
  const deduped = new Map<string, typeof allChunks[0]>();
  for (const chunk of allChunks) deduped.set(chunk.source_path, chunk);
  const uniqueChunks = Array.from(deduped.values());
  if (uniqueChunks.length < allChunks.length) {
    console.log(`   Deduped: ${allChunks.length} → ${uniqueChunks.length} chunks`);
  }
  allChunks.length = 0;
  allChunks.push(...uniqueChunks);

  console.log(`\n   Total chunks: ${allChunks.length}`);

  if (DRY_RUN) {
    console.log('\n✅  Dry run complete — no embeddings written');
    console.log('   Sample chunks:');
    allChunks.slice(0, 3).forEach(c => {
      console.log(`   [${c.source_type}] ${c.title}`);
      console.log(`   ${c.content.slice(0, 100)}…\n`);
    });
    return;
  }

  // Embed and upsert in batches
  const BATCH = 20;
  let written = 0;
  let errors = 0;

  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);
    process.stdout.write(`   Embedding batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(allChunks.length / BATCH)}…`);

    const rows = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const embedding = await embed(`${chunk.title}\n\n${chunk.content}`);
          return { ...chunk, embedding };
        } catch (err) {
          errors++;
          console.error(`\n   ⚠  Failed to embed: ${chunk.title} — ${err}`);
          return null;
        }
      })
    );

    // Deduplicate by source_path within the batch — last write wins
    const seen = new Map<string, typeof rows[0]>();
    for (const row of rows.filter(Boolean)) {
      seen.set((row as any).source_path, row);
    }
    const valid = Array.from(seen.values());
    if (valid.length > 0) {
      const { error } = await supabase
        .from('platform_knowledge_chunks')
        .upsert(valid, { onConflict: 'source_path' });

      if (error) {
        console.error(`\n   ✗  DB upsert failed: ${error.message}`);
        errors += valid.length;
      } else {
        written += valid.length;
        process.stdout.write(` ✓ (${written} written)\n`);
      }
    }

    // Rate limit: 3 req/s for OpenAI embeddings
    if (i + BATCH < allChunks.length) await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\n✅  Done: ${written} chunks embedded, ${errors} errors`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
