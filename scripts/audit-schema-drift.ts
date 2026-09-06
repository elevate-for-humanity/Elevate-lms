#!/usr/bin/env tsx
/**
 * Schema drift auditor.
 *
 * Scans application TypeScript source files for Supabase .select() calls,
 * extracts column names, and cross-references them against the live Supabase
 * schema (via PostgREST OpenAPI) or migration history as fallback.
 *
 * The repository is a monorepo. Portal runtime code lives under apps/*, so
 * apps/ must always be included in the scan. This is a production gate: a
 * portal selecting a column that does not exist in Supabase must fail CI.
 *
 * Usage:
 *   pnpm audit:schema
 *   pnpm audit:schema:strict
 *   pnpm tsx scripts/audit-schema-drift.ts --table program_enrollments
 *   pnpm tsx scripts/audit-schema-drift.ts --source migrations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const filterTable = args.find((a, i) => args[i - 1] === '--table') ?? null;
const failOnDrift = args.includes('--fail-on-drift');
const failOnNewDrift = args.includes('--fail-on-new-drift');
const baselinePathArg = args.find((a, i) => args[i - 1] === '--baseline') ?? null;
const writeBaselinePathArg = args.find((a, i) => args[i - 1] === '--write-baseline') ?? null;
const forceMigrations = args.includes('--source') && args[args.indexOf('--source') + 1] === 'migrations';

type DriftBaseline = { schemaSource?: string; entries?: string[] };

function readBaseline(root: string): DriftBaseline | null {
  if (!baselinePathArg) return null;
  const baselinePath = path.resolve(root, baselinePathArg);
  if (!fs.existsSync(baselinePath)) return null;
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as DriftBaseline;
}

type TableSchema = Map<string, Set<string>>;

function mergeGeneratedDatabaseTypes(schema: TableSchema, generatedTypesPath: string): boolean {
  if (!fs.existsSync(generatedTypesPath)) return false;

  const lines = fs.readFileSync(generatedTypesPath, 'utf8').split('\n');
  let inPublicSchema = false;
  let inRelations = false;
  let currentRelation: string | null = null;
  let inRow = false;

  for (const line of lines) {
    if (line === '  public: {') {
      inPublicSchema = true;
      continue;
    }
    if (!inPublicSchema) continue;

    if (line === '    Tables: {' || line === '    Views: {') {
      inRelations = true;
      currentRelation = null;
      inRow = false;
      continue;
    }
    if (/^    (?:Functions|Enums|CompositeTypes): \{$/.test(line)) {
      inRelations = false;
      currentRelation = null;
      inRow = false;
      continue;
    }
    if (!inRelations) continue;

    const relationMatch = line.match(/^      "?([A-Za-z_][A-Za-z0-9_]*)"?: \{$/);
    if (relationMatch) {
      currentRelation = relationMatch[1].toLowerCase();
      if (!schema.has(currentRelation)) schema.set(currentRelation, new Set());
      inRow = false;
      continue;
    }
    if (currentRelation && line === '        Row: {') {
      inRow = true;
      continue;
    }
    if (inRow && line === '        }') {
      inRow = false;
      continue;
    }
    if (!inRow || !currentRelation) continue;

    const columnMatch = line.match(/^          "?([A-Za-z_][A-Za-z0-9_]*)"?\??:/);
    if (columnMatch) schema.get(currentRelation)!.add(columnMatch[1].toLowerCase());
  }

  return true;
}

function splitTopLevelCommaList(input: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quote) {
      if (char === quote && input[i + 1] === quote) {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
    } else if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    } else if (char === ',' && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(input.slice(start));
  return parts;
}

function findTopLevelKeyword(input: string, start: number, keyword: string): number {
  let depth = 0;
  let quote: "'" | '"' | null = null;
  const lower = input.toLowerCase();

  for (let i = start; i < input.length; i += 1) {
    const char = input[i];
    if (quote) {
      if (char === quote && input[i + 1] === quote) {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (char === '(') {
      depth += 1;
      continue;
    }
    if (char === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (
      depth === 0 &&
      lower.startsWith(keyword, i) &&
      !/[a-z0-9_]/i.test(input[i - 1] ?? '') &&
      !/[a-z0-9_]/i.test(input[i + keyword.length] ?? '')
    ) {
      return i;
    }
  }
  return -1;
}

function mergeMigrationViews(schema: TableSchema, sql: string): void {
  const viewRe = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?"?([A-Za-z_][A-Za-z0-9_]*)"?(?:\s*\([^)]*\))?\s+AS\s+SELECT\s+/gi;
  let match: RegExpExecArray | null;

  while ((match = viewRe.exec(sql)) !== null) {
    const table = match[1].toLowerCase();
    const selectStart = match.index + match[0].length;
    const fromIndex = findTopLevelKeyword(sql, selectStart, 'from');
    if (fromIndex === -1) continue;
    if (!schema.has(table)) schema.set(table, new Set());

    for (const rawExpression of splitTopLevelCommaList(sql.slice(selectStart, fromIndex))) {
      const expression = rawExpression.replace(/--[^\n]*/g, '').trim();
      const alias = expression.match(/\s+AS\s+"?([A-Za-z_][A-Za-z0-9_]*)"?\s*$/i);
      const direct = expression.match(/(?:^|\.)(?:"?([A-Za-z_][A-Za-z0-9_]*)"?)(?:::[A-Za-z_][A-Za-z0-9_]*(?:\[\])?)?\s*$/);
      const column = alias?.[1] ?? direct?.[1];
      if (column) schema.get(table)!.add(column.toLowerCase());
    }
  }
}

async function fetchLiveSchema(supabaseUrl: string, serviceKey: string): Promise<TableSchema | null> {
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return null;
    const swagger = await res.json() as any;
    const schema: TableSchema = new Map();
    for (const [tableName, defn] of Object.entries(swagger.definitions ?? {})) {
      const cols = new Set(
        Object.keys((defn as any).properties ?? {}).map((c: string) => c.toLowerCase()),
      );
      schema.set(tableName.toLowerCase(), cols);
    }
    return schema;
  } catch {
    return null;
  }
}

function parseMigrations(migrationsDir: string): TableSchema {
  const schema: TableSchema = new Map();
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => path.join(migrationsDir, f));

  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8');

    const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([^;]+?)\);/gis;
    let m: RegExpExecArray | null;
    while ((m = createRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      if (!schema.has(t)) schema.set(t, new Set());
      const lineRe = /^\s+"?(\w+)"?\s+\w/gm;
      let lm: RegExpExecArray | null;
      while ((lm = lineRe.exec(m[2])) !== null) {
        const col = lm[1].toLowerCase();
        if (!['primary', 'unique', 'check', 'foreign', 'constraint', 'index'].includes(col)) {
          schema.get(t)!.add(col);
        }
      }
    }

    const addRe = /ALTER\s+TABLE\s+(?:public\.)?"?(\w+)"?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
    while ((m = addRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      if (!schema.has(t)) schema.set(t, new Set());
      schema.get(t)!.add(m[2].toLowerCase());
    }

    const multiRe = /ALTER\s+TABLE\s+(?:public\.)?"?(\w+)"?\s*\n([\s\S]*?)(?=;\s*\n|ALTER\s+TABLE|CREATE\s+)/gi;
    while ((m = multiRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      const blockRe = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
      let lm: RegExpExecArray | null;
      while ((lm = blockRe.exec(m[2])) !== null) {
        if (!schema.has(t)) schema.set(t, new Set());
        schema.get(t)!.add(lm[1].toLowerCase());
      }
    }

    mergeMigrationViews(schema, sql);
  }
  return schema;
}

function parseSelectColumns(selectStr: string): string[] {
  let s = selectStr;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\w+(?:![\w-]+)?\s*\([^()]*\)/g, '');
  }
  return s
    .split(/[\s,\n]+/)
    .map((token) => {
      let t = token.trim();
      if (t.includes(':')) t = t.split(':').pop()!;
      if (t.includes('->')) t = t.split('->')[0];
      t = t.replace(/^!/, '').replace(/\(.*$/, '').replace(/[^a-z0-9_]/gi, '');
      return t.toLowerCase();
    })
    .filter(
      (t) =>
        t.length > 0 &&
        !/^(select|from|where|join|on|and|or|inner|left|right|outer|count|sum|avg|min|max|not|null|true|false)$/.test(t),
    );
}

interface SelectCall {
  file: string;
  line: number;
  table: string;
  columns: string[] | 'dynamic';
}

function extractSelectCalls(srcDirs: string[]): SelectCall[] {
  const results: SelectCall[] = [];
  const patterns = srcDirs
    .filter((d) => fs.existsSync(d))
    .map((d) => `${d}/**/*.{ts,tsx,js,jsx}`);
  const files = patterns.flatMap((pattern) =>
    glob.sync(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/archive/**',
        '**/app-legacy/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    }),
  );

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const fromRe = /\.from\(\s*['"`](\w+)['"`]\s*\)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fromRe.exec(src)) !== null) {
      const table = fm[1].toLowerCase();
      if (filterTable && table !== filterTable.toLowerCase()) continue;
      const lineNum = src.slice(0, fm.index).split('\n').length;
      const chainStart = fm.index + fm[0].length;
      const window = src.slice(chainStart, chainStart + 1200);
      // A source file often contains several Supabase queries close together.
      // Never associate a later query's select() with the current from().
      const nextFrom = window.search(/\.from\(\s*['"`]/);
      const ahead = nextFrom === -1 ? window : window.slice(0, nextFrom);
      // Supabase commonly uses select('id', { count: 'exact', head: true }).
      // The old auditor required the closing parenthesis immediately after the
      // select string and therefore missed these production queries.
      const selectRe = /\.select\(\s*(`[^`]*`|'[^']*'|"[^"]*"|\w+)\s*(?:,\s*\{[\s\S]*?\})?\s*\)/;
      const sm = selectRe.exec(ahead);
      if (!sm) continue;
      const raw = sm[1];
      let columns: string[] | 'dynamic';
      if (/^[`'"]/.test(raw)) {
        const inner = raw.slice(1, -1);
        columns = inner.includes('${') ? 'dynamic' : parseSelectColumns(inner);
      } else {
        columns = 'dynamic';
      }
      results.push({ file, line: lineNum, table, columns });
    }
  }
  return results;
}

interface DriftResult {
  file: string;
  line: number;
  table: string;
  unknownColumns: string[];
  tableKnown: boolean;
}

type DriftSignatureParts = {
  file: string;
  table: string;
  detail: string;
};

function parseDriftSignature(signature: string): DriftSignatureParts | null {
  const parts = signature.split('|');
  if (parts.length !== 3 || parts.some((part) => !part)) return null;
  return { file: parts[0], table: parts[1], detail: parts[2] };
}

function isCoveredByBaseline(signature: string, baselineEntries: string[]): boolean {
  const current = parseDriftSignature(signature);
  if (!current) return baselineEntries.includes(signature);

  return baselineEntries.some((entry) => {
    const baseline = parseDriftSignature(entry);
    if (!baseline || baseline.file !== current.file || baseline.table !== current.table) {
      return false;
    }
    if (baseline.detail === 'TABLE_NOT_IN_SCHEMA') return true;
    if (current.detail === 'TABLE_NOT_IN_SCHEMA') return false;

    const baselineColumns = new Set(baseline.detail.split(','));
    return current.detail.split(',').every((column) => baselineColumns.has(column));
  });
}

function auditDrift(calls: SelectCall[], schema: TableSchema): DriftResult[] {
  const drifts: DriftResult[] = [];
  for (const call of calls) {
    if (call.columns === 'dynamic') continue;
    const tableKnown = schema.has(call.table);
    const knownCols = schema.get(call.table) ?? new Set<string>();
    const directCols = call.columns.filter((c) => c.length > 0 && !c.includes(' ') && c !== '*');
    const unknown = directCols.filter((c) => !knownCols.has(c.toLowerCase()));
    if (!tableKnown || unknown.length > 0) {
      drifts.push({ file: call.file, line: call.line, table: call.table, unknownColumns: unknown, tableKnown });
    }
  }
  return drifts;
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const migrationsDir = path.join(root, 'supabase', 'migrations');
  const generatedTypesPath = path.join(root, 'types', 'database.generated.ts');
  const baseline = readBaseline(root);
  const baselineUsesMigrations = baseline?.schemaSource?.startsWith('migrations') === true;
  const srcDirs = ['app', 'apps', 'lib', 'components', 'packages']
    .map((d) => path.join(root, d));

  // CI/runtime environment is authoritative. .env.local is only a local fallback.
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    try {
      const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
      for (const line of env.split('\n')) {
        const m = line.match(/^([^#=\s]+)=(.+)/);
        if (!m) continue;
        if (!supabaseUrl && (m[1] === 'NEXT_PUBLIC_SUPABASE_URL' || m[1] === 'SUPABASE_URL')) supabaseUrl = m[2].trim();
        if (!serviceKey && m[1] === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = m[2].trim();
      }
    } catch {}
  }

  let schema: TableSchema;
  let schemaSource: string;

  if (!forceMigrations && !baselineUsesMigrations && supabaseUrl && serviceKey) {
    process.stdout.write('Fetching live schema from Supabase...');
    const live = await fetchLiveSchema(supabaseUrl, serviceKey);
    if (live) {
      schema = live;
      schemaSource = `live Supabase (${schema.size} tables)`;
    } else {
      process.stdout.write(' failed, falling back to migrations\n');
      schema = parseMigrations(migrationsDir);
      const mergedGeneratedTypes = mergeGeneratedDatabaseTypes(schema, generatedTypesPath);
      schemaSource = `migrations${mergedGeneratedTypes ? ' + generated types' : ''} (${schema.size} relations — live schema unavailable)`;
    }
  } else {
    schema = parseMigrations(migrationsDir);
    const mergedGeneratedTypes = mergeGeneratedDatabaseTypes(schema, generatedTypesPath);
    schemaSource = `migrations${mergedGeneratedTypes ? ' + generated types' : ''} (${schema.size} relations — live schema credentials unavailable)`;
  }
  console.log(` ${schemaSource}`);

  process.stdout.write('Scanning source files...');
  const calls = extractSelectCalls(srcDirs);
  console.log(` ${calls.length} .select() calls found\n`);

  const drifts = auditDrift(calls, schema);
  const signatureFor = (drift: DriftResult) => {
    const relPath = path.relative(root, drift.file).split(path.sep).join('/');
    const detail = drift.tableKnown
      ? [...drift.unknownColumns].sort().join(',')
      : 'TABLE_NOT_IN_SCHEMA';
    return `${relPath}|${drift.table}|${detail}`;
  };
  const driftSignatures = [...new Set(drifts.map(signatureFor))].sort();
  const currentSignatureSet = new Set(driftSignatures);
  let newDriftSignatures: string[] = [];

  if (writeBaselinePathArg) {
    const baselinePath = path.resolve(root, writeBaselinePathArg);
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(
      baselinePath,
      JSON.stringify({ schemaSource, entryCount: driftSignatures.length, entries: driftSignatures }, null, 2) + '\n',
    );
    console.log(`Wrote schema drift baseline: ${path.relative(root, baselinePath)} (${driftSignatures.length} signatures)`);
  }

  if (baselinePathArg) {
    const baselinePath = path.resolve(root, baselinePathArg);
    if (!fs.existsSync(baselinePath)) {
      console.error(`Schema drift baseline not found: ${path.relative(root, baselinePath)}`);
      process.exit(1);
    }
    const baselineEntries = Array.isArray(baseline?.entries) ? baseline.entries : [];
    newDriftSignatures = driftSignatures.filter(
      (signature) => !isCoveredByBaseline(signature, baselineEntries),
    );
    const resolvedCount = baselineEntries.filter((signature) => !currentSignatureSet.has(signature)).length;
    console.log(`Schema drift regression check: ${newDriftSignatures.length} new, ${resolvedCount} resolved, ${driftSignatures.length} current signatures.`);
  }

  if (drifts.length === 0) {
    console.log('No schema drift detected.\n');
    process.exit(0);
  }

  const byTable = new Map<string, DriftResult[]>();
  for (const drift of drifts) {
    if (!byTable.has(drift.table)) byTable.set(drift.table, []);
    byTable.get(drift.table)!.push(drift);
  }

  console.log(`Schema drift detected in ${drifts.length} location(s):\n`);
  for (const [table, results] of byTable) {
    const label = results[0].tableKnown ? table : `${table} (TABLE NOT IN SCHEMA)`;
    console.log(`  Table: ${label}`);
    console.log(`  ${'─'.repeat(60)}`);
    for (const result of results) {
      const relPath = path.relative(root, result.file);
      if (!result.tableKnown) {
        console.log(`    ${relPath}:${result.line}  — table not found in schema`);
      } else {
        console.log(`    ${relPath}:${result.line}  — unknown columns: ${result.unknownColumns.join(', ')}`);
      }
    }
    console.log('');
  }

  if (failOnNewDrift && newDriftSignatures.length > 0) {
    console.error(`New schema drift detected: ${newDriftSignatures.length} signature(s).`);
    for (const signature of newDriftSignatures.slice(0, 50)) console.error(`  NEW: ${signature}`);
    process.exit(1);
  }
  if (failOnDrift) process.exit(1);
}

main();
