#!/usr/bin/env node
// Runs each statement of a SQL file through the Supabase Management API
// (POST /v1/projects/{ref}/database/query) and prints the rows as JSON.
import { readFileSync, writeFileSync } from 'node:fs';

export function splitStatements(sql) {
  return sql.split(/;\s*(?:\n|$)/)
    .map(statement => statement.split('\n').filter(line => !/^\s*--/.test(line)).join('\n').trim())
    .filter(Boolean);
}

async function main() {
  const [file, out] = process.argv.slice(2);
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (!file) throw Error('usage: run-management-sql.mjs <file.sql> [out.json]');
  if (!token || !ref) throw Error('SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required');
  const results = [];
  for (const query of splitStatements(readFileSync(file, 'utf8'))) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const text = await response.text();
    if (!response.ok) throw Error(`SQL_QUERY_FAILED ${response.status}: ${text.slice(0, 500)}`);
    results.push(JSON.parse(text));
  }
  const json = JSON.stringify(results, null, 2);
  if (out) writeFileSync(out, json);
  console.log(json);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}
