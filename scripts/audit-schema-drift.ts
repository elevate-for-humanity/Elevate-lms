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

type TableSchema = Map<string, Set<string>>;

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

    const addRe = /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
    while ((m = addRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      if (!schema.has(t)) schema.set(t, new Set());
      schema.get(t)!.add(m[2].toLowerCase());
    }

    const multiRe = /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s*\n([\s\S]*?)(?=;\s*\n|ALTER\s+TABLE|CREATE\s+)/gi;
    while ((m = multiRe.exec(sql)) !== null) {
      const t = m[1].toLowerCase();
      const blockRe = /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+\w/gi;
      let lm: RegExpExecArray | null;
      while ((lm = blockRe.exec(m[2])) !== null) {
        if (!schema.has(t)) schema.set(t, new Set());
        schema.get(t)!.add(lm[1].toLowerCase());
      }
    }
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

  if (!forceMigrations && supabaseUrl && serviceKey) {
    process.stdout.write('Fetching live schema from Supabase...');
    const live = await fetchLiveSchema(supabaseUrl, serviceKey);
    if (live) {
      schema = live;
      schemaSource = `live Supabase (${schema.size} tables)`;
    } else {
      process.stdout.write(' failed, falling back to migrations\n');
      schema = parseMigrations(migrationsDir);
      schemaSource = `migrations (${schema.size} tables — live schema unavailable)`;
    }
  } else {
    schema = parseMigrations(migrationsDir);
    schemaSource = `migrations (${schema.size} tables — live schema credentials unavailable)`;
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
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as { entries?: string[] };
    const baselineEntries = Array.isArray(baseline.entries) ? baseline.entries : [];
    const baselineSet = new Set(baselineEntries);
    newDriftSignatures = driftSignatures.filter((signature) => !baselineSet.has(signature));
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
