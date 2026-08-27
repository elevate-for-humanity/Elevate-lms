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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
if (!supabaseUrl || !serviceKey) {
  console.error('❌ Live Supabase URL and service-role key are required for mutation schema audit.');
  process.exit(1);
}

const response = await fetch(`${supabaseUrl}/rest/v1/`, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
});
if (!response.ok) {
  console.error(`❌ Could not load live Supabase schema: HTTP ${response.status}`);
  process.exit(1);
}
const swagger = await response.json() as any;
const schema = new Map<string, Set<string>>();
for (const [tableName, definition] of Object.entries(swagger.definitions ?? {})) {
  schema.set(
    tableName.toLowerCase(),
    new Set(Object.keys((definition as any).properties ?? {}).map((column) => column.toLowerCase())),
  );
}

function skipQuoted(source: string, index: number): number {
  const quote = source[index];
  index += 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) return index + 1;
    index += 1;
  }
  return index;
}

/**
 * Advance past one object-property value. The previous scanner resumed token
 * parsing immediately after the property colon, so ternaries such as
 * \`error instanceof Error ? error.message : String(error)\` were misread as a
 * property named \`message\`. The same bug produced impossible column names such
 * as \`null\`, \`false\`, and \`now\`.
 */
function skipPropertyValue(source: string, index: number): number {
  let braces = 0;
  let brackets = 0;
  let parentheses = 0;

  while (index < source.length) {
    const ch = source[index];
    if (ch === '"' || ch === "'" || ch === '\\`') {
      index = skipQuoted(source, index);
      continue;
    }
    if (ch === '/' && source[index + 1] === '/') {
      const end = source.indexOf('\\n', index + 2);
      index = end < 0 ? source.length : end + 1;
      continue;
    }
    if (ch === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);
      index = end < 0 ? source.length : end + 2;
      continue;
    }

    if (ch === '{') braces += 1;
    else if (ch === '}') {
      if (braces === 0 && brackets === 0 && parentheses === 0) return index;
      braces -= 1;
    } else if (ch === '[') brackets += 1;
    else if (ch === ']') brackets -= 1;
    else if (ch === '(') parentheses += 1;
    else if (ch === ')') parentheses -= 1;
    else if (ch === ',' && braces === 0 && brackets === 0 && parentheses === 0) {
      return index + 1;
    }
    index += 1;
  }
  return index;
}

function topLevelObjectKeys(source: string, openBrace: number): string[] {
  const keys: string[] = [];
  let depth = 0;
  let i = openBrace;

  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipQuoted(source, i);
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i + 2);
      if (i < 0) break;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) break;
      i += 1;
      continue;
    }

    if (depth === 1) {
      if (/\s|,/.test(ch)) {
        i += 1;
        continue;
      }
      if (source.startsWith('...', i)) {
        while (i < source.length && source[i] !== ',' && source[i] !== '}') i += 1;
        continue;
      }

      let key = '';
      if (/[A-Za-z_$]/.test(ch)) {
        const start = i;
        i += 1;
        while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) i += 1;
        key = source.slice(start, i);
      } else if (ch === '"' || ch === "'") {
        const start = i + 1;
        const end = skipQuoted(source, i) - 1;
        key = source.slice(start, end);
        i = end + 1;
      } else {
        i += 1;
        continue;
      }

      while (i < source.length && /\s/.test(source[i])) i += 1;
      if (source[i] === ':') {
        keys.push(key.toLowerCase());
        i = skipPropertyValue(source, i + 1);
        continue;
      }
      // Shorthand object properties are valid but cannot be distinguished
      // reliably from method syntax here, so skip them rather than false-fail.
      continue;
    }
    i += 1;
  }
  return [...new Set(keys)];
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

console.log(`Checked ${literalMutations} literal Supabase mutation payload(s) against ${schema.size} live tables.`);
if (failures.length) {
  for (const failure of failures) {
    console.error(`❌ ${failure.file}:${failure.line} ${failure.operation} ${failure.table} — unknown columns: ${failure.unknown.join(', ')}`);
  }
  console.error(`\n❌ Supabase mutation schema audit failed in ${failures.length} location(s).`);
  process.exit(1);
}
console.log('✅ Supabase mutation schema audit passed.');
