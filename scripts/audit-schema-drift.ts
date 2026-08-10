#!/usr/bin/env tsx
/**
 * Live Supabase schema contract auditor.
 *
 * Scans the three deployed Next.js applications plus shared server code for
 * PostgREST .from(...).select(...) calls and verifies referenced tables/columns
 * against the live Supabase OpenAPI schema.
 *
 * Usage:
 *   pnpm audit:schema
 *   pnpm audit:schema:strict
 *   pnpm tsx scripts/audit-schema-drift.ts --fail-on-drift --require-live
 *   pnpm tsx scripts/audit-schema-drift.ts --fail-on-drift --require-live --changed-only
 *   pnpm tsx scripts/audit-schema-drift.ts --table applications
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const filterTable = args.find((arg, index) => args[index - 1] === '--table')?.toLowerCase() ?? null;
const failOnDrift = args.includes('--fail-on-drift');
const requireLive = args.includes('--require-live');
const changedOnly = args.includes('--changed-only');
const forceMigrations = args.includes('--source') && args[args.indexOf('--source') + 1] === 'migrations';

type TableSchema = Map<string, Set<string>>;

type SelectCall = {
  file: string;
  line: number;
  table: string;
  columns: string[] | 'dynamic';
};

type DriftResult = {
  file: string;
  line: number;
  table: string;
  unknownColumns: string[];
  tableKnown: boolean;
};

function readDotEnvLocal() {
  const result: Record<string, string> = {};
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const match = line.match(/^([^#=\s]+)=(.*)$/);
      if (!match) continue;
      result[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // CI and production use process.env; local file is optional.
  }
  return result;
}

async function fetchLiveSchema(supabaseUrl: string, serviceKey: string): Promise<TableSchema | null> {
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/openapi+json, application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;

    const swagger = (await response.json()) as any;
    const schema: TableSchema = new Map();
    for (const [tableName, definition] of Object.entries(swagger.definitions ?? {})) {
      const properties = Object.keys((definition as any)?.properties ?? {});
      schema.set(tableName.toLowerCase(), new Set(properties.map((column) => column.toLowerCase())));
    }
    return schema;
  } catch {
    return null;
  }
}

function parseMigrations(migrationsDir: string): TableSchema {
  const schema: TableSchema = new Map();
  const files = glob.sync('**/*.sql', {
    cwd: migrationsDir,
    absolute: true,
    ignore: ['pending/**', 'archive/**', 'archived/**', 'legacy/**'],
  }).sort();

  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;

    const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?(\w+)"?\s*\(([^;]+?)\);/gis;
    while ((match = createRe.exec(sql)) !== null) {
      const table = match[1].toLowerCase();
      if (!schema.has(table)) schema.set(table, new Set());
      const lineRe = /^\s*"?(\w+)"?\s+[A-Za-z][A-Za-z0-9_\s\[\]]*/gm;
      let lineMatch: RegExpExecArray | null;
      while ((lineMatch = lineRe.exec(match[2])) !== null) {
        const column = lineMatch[1].toLowerCase();
        if (!['primary', 'unique', 'check', 'foreign', 'constraint', 'index'].includes(column)) {
          schema.get(table)!.add(column);
        }
      }
    }

    const addRe = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?"?(\w+)"?[\s\S]{0,300}?ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;
    while ((match = addRe.exec(sql)) !== null) {
      const table = match[1].toLowerCase();
      if (!schema.has(table)) schema.set(table, new Set());
      schema.get(table)!.add(match[2].toLowerCase());
    }
  }

  return schema;
}

function splitTopLevelSelect(select: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of select) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current);
  return parts;
}

function parseSelectColumns(select: string): string[] {
  return splitTopLevelSelect(select)
    .map((token) => token.trim())
    // Nested PostgREST relationship projections (for example
    // `profile:profiles(full_name)`) are columns on the related table, not on
    // the base table passed to .from(). Ignore the whole nested projection.
    .filter((token) => token && !token.includes('('))
    .map((token) => {
      let cleaned = token;
      // PostgREST scalar aliases are `alias:column`; validate the source column.
      if (cleaned.includes(':')) cleaned = cleaned.split(':').pop()!;
      // JSON traversal validates the root column only.
      if (cleaned.includes('->')) cleaned = cleaned.split('->')[0];
      cleaned = cleaned.replace(/^!/, '').replace(/[^A-Za-z0-9_*]/g, '');
      return cleaned.toLowerCase();
    })
    .filter((column) => column && column !== '*');
}

function allSourceFiles(): string[] {
  const patterns = [
    'apps/marketing/**/*.{ts,tsx}',
    'apps/lms/**/*.{ts,tsx}',
    'apps/admin/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
  ];

  return patterns.flatMap((pattern) =>
    glob.sync(pattern, {
      cwd: ROOT,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**',
        '**/fixtures/**',
      ],
    }),
  );
}

function changedSourceFiles(): string[] {
  const candidates: string[][] = [
    ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD^1', 'HEAD'],
    ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD^', 'HEAD'],
  ];

  for (const command of candidates) {
    try {
      const output = execFileSync('git', command, { cwd: ROOT, encoding: 'utf8' });
      const files = output
        .split('\n')
        .map((file) => file.trim())
        .filter(Boolean)
        .filter((file) => /^(apps\/(marketing|lms|admin)|lib|components)\/.*\.(ts|tsx)$/.test(file))
        .map((file) => path.join(ROOT, file))
        .filter((file) => fs.existsSync(file));
      return [...new Set(files)];
    } catch {
      // Try the next git comparison shape.
    }
  }

  throw new Error('changed-only schema audit requires git history for the previous/base commit');
}

function sourceFiles(): string[] {
  return changedOnly ? changedSourceFiles() : allSourceFiles();
}

function extractSelectCalls(): SelectCall[] {
  const results: SelectCall[] = [];

  for (const file of sourceFiles()) {
    const source = fs.readFileSync(file, 'utf8');
    const fromRe = /\.from\(\s*['"`](\w+)['"`]\s*\)/g;
    let match: RegExpExecArray | null;

    while ((match = fromRe.exec(source)) !== null) {
      const table = match[1].toLowerCase();
      if (filterTable && table !== filterTable) continue;

      const line = source.slice(0, match.index).split('\n').length;
      const chainStart = match.index + match[0].length;
      const tail = source.slice(chainStart, chainStart + 2000);

      // Never associate a .select() from a later Supabase query with this
      // .from(). The previous implementation searched an arbitrary window,
      // producing hundreds of false schema-drift failures.
      const boundaries = [tail.indexOf('.from('), tail.indexOf(';')].filter((index) => index >= 0);
      const chainEnd = boundaries.length ? Math.min(...boundaries) : tail.length;
      const chain = tail.slice(0, chainEnd);
      const selectMatch = chain.match(/\.select\(\s*(`[^`]*`|'[^']*'|"[^"]*"|[A-Za-z_$][\w$]*)\s*\)/);
      if (!selectMatch) continue;

      const raw = selectMatch[1];
      const columns: string[] | 'dynamic' = /^[`'"]/.test(raw)
        ? raw.includes('${')
          ? 'dynamic'
          : parseSelectColumns(raw.slice(1, -1))
        : 'dynamic';

      results.push({ file, line, table, columns });
    }
  }

  return results;
}

function auditDrift(calls: SelectCall[], schema: TableSchema): DriftResult[] {
  const drift: DriftResult[] = [];
  for (const call of calls) {
    if (call.columns === 'dynamic') continue;
    const knownColumns = schema.get(call.table);
    if (!knownColumns) {
      drift.push({ ...call, unknownColumns: call.columns, tableKnown: false });
      continue;
    }
    const unknownColumns = call.columns.filter((column) => !knownColumns.has(column));
    if (unknownColumns.length) {
      drift.push({ ...call, unknownColumns, tableKnown: true });
    }
  }
  return drift;
}

async function main() {
  const localEnv = readDotEnvLocal();
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    localEnv.SUPABASE_URL ||
    localEnv.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY || '';

  let schema: TableSchema | null = null;
  let source = '';

  if (!forceMigrations && supabaseUrl && serviceKey) {
    process.stdout.write('Fetching live Supabase schema... ');
    schema = await fetchLiveSchema(supabaseUrl, serviceKey);
    if (schema) {
      source = `live Supabase (${schema.size} relations)`;
      console.log(source);
    } else {
      console.log('failed');
    }
  }

  if (!schema) {
    if (requireLive) {
      console.error('FAIL: live Supabase schema is required but could not be loaded.');
      process.exit(1);
    }
    schema = parseMigrations(path.join(ROOT, 'supabase', 'migrations'));
    source = `applied-migration files (${schema.size} relations; pending/archive excluded)`;
    console.log(`Using ${source}.`);
  }

  const files = sourceFiles();
  const calls = extractSelectCalls();
  const drift = auditDrift(calls, schema);

  console.log(
    `Scanned ${calls.length} static Supabase select call(s) in ${files.length} ${changedOnly ? 'changed ' : ''}source file(s) against ${source}.`,
  );

  if (!drift.length) {
    console.log('PASS: no static table/column drift detected in the audited scope.');
    return;
  }

  const grouped = new Map<string, DriftResult[]>();
  for (const item of drift) {
    if (!grouped.has(item.table)) grouped.set(item.table, []);
    grouped.get(item.table)!.push(item);
  }

  console.error(`Schema drift detected in ${drift.length} source location(s):`);
  for (const [table, items] of grouped) {
    const tableKnown = items[0].tableKnown;
    console.error(`\n${table}${tableKnown ? '' : ' (TABLE NOT IN LIVE SCHEMA)'}`);
    for (const item of items) {
      const relative = path.relative(ROOT, item.file);
      const detail = tableKnown
        ? `unknown column(s): ${item.unknownColumns.join(', ')}`
        : 'table not found';
      console.error(`  ${relative}:${item.line} — ${detail}`);
    }
  }

  if (failOnDrift) process.exit(1);
}

main().catch((error) => {
  console.error('Schema audit failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});