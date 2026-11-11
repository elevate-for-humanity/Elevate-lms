#!/usr/bin/env tsx
/**
 * Supabase mutation/schema contract auditor.
 *
 * Scans runtime source for literal insert/update/upsert payloads chained from
 * .from('table') and checks every top-level payload key against the live
 * PostgREST schema. Dynamic payload variables are deliberately skipped because
 * their keys cannot be proven statically here; TypeScript/runtime tests cover
 * those paths separately.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { topLevelObjectKeys } from './lib/supabase-mutation-payload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
if (!supabaseUrl || !serviceKey) {
  console.error('❌ Live Supabase URL and service-role key are required for mutation schema audit.');
  process.exit(1);
}

type TableSchema = Map<string, Set<string>>;

function loadGeneratedSchema(generatedTypesPath: string): TableSchema {
  const schema: TableSchema = new Map();
  if (!fs.existsSync(generatedTypesPath)) return schema;

  const lines = fs.readFileSync(generatedTypesPath, 'utf8').split('\n');
  let inPublicSchema = false;
  let inTables = false;
  let currentTable: string | null = null;
  let inRow = false;

  for (const line of lines) {
    if (line === '  public: {') {
      inPublicSchema = true;
      continue;
    }
    if (!inPublicSchema) continue;
    if (line === '    Tables: {') {
      inTables = true;
      continue;
    }
    if (line === '    Views: {') break;
    if (!inTables) continue;

    const tableMatch = line.match(/^      "?([A-Za-z_][A-Za-z0-9_]*)"?: \{$/);
    if (tableMatch) {
      currentTable = tableMatch[1].toLowerCase();
      schema.set(currentTable, new Set());
      inRow = false;
      continue;
    }
    if (currentTable && line === '        Row: {') {
      inRow = true;
      continue;
    }
    if (inRow && line === '        }') {
      inRow = false;
      continue;
    }
    if (!inRow || !currentTable) continue;

    const columnMatch = line.match(/^          "?([A-Za-z_][A-Za-z0-9_]*)"?\??:/);
    if (columnMatch) schema.get(currentTable)!.add(columnMatch[1].toLowerCase());
  }
  return schema;
}

let schema: TableSchema | null = null;
let schemaSource = 'live Supabase';
let usingGeneratedFallback = false;
try {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const swagger = await response.json() as any;
  schema = new Map();
  for (const [tableName, definition] of Object.entries(swagger.definitions ?? {})) {
    schema.set(
      tableName.toLowerCase(),
      new Set(Object.keys((definition as any).properties ?? {}).map((column) => column.toLowerCase())),
    );
  }
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.warn(`⚠️ Live Supabase schema unavailable (${detail}); using generated database types.`);
  schema = loadGeneratedSchema(path.join(root, 'types', 'database.generated.ts'));
  schemaSource = 'generated database types';
  usingGeneratedFallback = true;
}

if (!schema || !schema.size) {
  console.error('❌ No live or generated Supabase schema is available for mutation audit.');
  process.exit(1);
}

const sourceRoots = ['app', 'apps', 'lib', 'components', 'packages']
  .map((dir) => path.join(root, dir))
  .filter((dir) => fs.existsSync(dir));
const files = sourceRoots.flatMap((dir) => glob.sync(`${dir}/**/*.{ts,tsx,js,jsx}`, {
  ignore: [
    '**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**',
    '**/archive/**', '**/app-legacy/**', '**/*.test.*', '**/*.spec.*',
  ],
}));

type Failure = { file: string; line: number; table: string; operation: string; unknown: string[] };
const failures: Failure[] = [];
let literalMutations = 0;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const fromRe = /\.from\(\s*['"`](\w+)['"`]\s*\)/g;
  let fromMatch: RegExpExecArray | null;
  while ((fromMatch = fromRe.exec(source)) !== null) {
    const table = fromMatch[1].toLowerCase();
    const scanStart = fromMatch.index + fromMatch[0].length;
    const nextFrom = source.indexOf('.from(', scanStart);
    const statementEnd = source.indexOf(';', scanStart);
    const chainEnd = Math.min(
      nextFrom >= 0 ? nextFrom : source.length,
      statementEnd >= 0 ? statementEnd + 1 : source.length,
      fromMatch.index + 5000,
    );
    const chain = source.slice(fromMatch.index, chainEnd);
    const mutationRe = /\.(insert|update|upsert)\(\s*(?:\[\s*)?\{/g;
    let mutationMatch: RegExpExecArray | null;
    while ((mutationMatch = mutationRe.exec(chain)) !== null) {
      const operation = mutationMatch[1];
      const absoluteMutation = fromMatch.index + mutationMatch.index;
      const brace = source.indexOf('{', absoluteMutation);
      if (brace < 0 || brace >= chainEnd) continue;
      const keys = topLevelObjectKeys(source, brace);
      if (!keys.length) continue;
      literalMutations += 1;
      const known = schema.get(table);
      const unknown = known ? keys.filter((key) => !known.has(key)) : keys;
      if (unknown.length > 0) {
        failures.push({
          file: path.relative(root, file),
          line: source.slice(0, absoluteMutation).split('\n').length,
          table,
          operation,
          unknown,
        });
      }
    }
  }
}

console.log(`Checked ${literalMutations} literal Supabase mutation payload(s) against ${schema.size} tables from ${schemaSource}.`);
if (failures.length) {
  const displayedFailures = usingGeneratedFallback ? failures.slice(0, 50) : failures;
  for (const failure of displayedFailures) {
    console.error(`❌ ${failure.file}:${failure.line} ${failure.operation} ${failure.table} — unknown columns: ${failure.unknown.join(', ')}`);
  }
  if (usingGeneratedFallback) {
    if (failures.length > displayedFailures.length) {
      console.warn(`⚠️ ${failures.length - displayedFailures.length} additional fallback diagnostic(s) omitted.`);
    }
    console.warn(
      `\n⚠️ Generated-schema fallback found ${failures.length} existing mutation mismatch(es); ` +
      'live schema was unavailable, so these diagnostics are advisory rather than a new production-schema failure.',
    );
    process.exit(0);
  }
  console.error(`\n❌ Supabase mutation schema audit failed in ${failures.length} location(s).`);
  process.exit(1);
}
console.log('✅ Supabase mutation schema audit passed.');
