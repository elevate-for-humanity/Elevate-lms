import { readFile, writeFile } from 'node:fs/promises';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : null;
}

function resultRows(raw: unknown): unknown[] {
  const root = asObject(raw);
  if (!root) return [];
  if (Array.isArray(root.results)) return root.results;
  const nested = asObject(root.results);
  if (nested && Array.isArray(nested.results)) return nested.results;
  if (Array.isArray(root.table)) return root.table;
  return [];
}

function strings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => strings(entry, output));
  else if (value && typeof value === 'object') Object.values(value as JsonObject).forEach((entry) => strings(entry, output));
  return output;
}

const INFRA_PATTERNS = [
  /no credits remaining/i,
  /insufficient[_ -]?quota/i,
  /billing/i,
  /quota exceeded/i,
  /rate limit/i,
  /429\b/i,
  /provider credentials? (?:are )?not configured/i,
  /no ai provider credentials/i,
  /all configured ai providers failed/i,
  /all configured grading providers failed/i,
  /github models (?:401|403|404|429|5\d\d)/i,
  /github models.*(?:not enabled|not available|request failed)/i,
  /authentication.*provider/i,
  /api key.*(?:invalid|disabled|expired)/i,
];

function isInfrastructureFailure(row: unknown): boolean {
  const text = strings(row).join(' | ');
  return INFRA_PATTERNS.some((pattern) => pattern.test(text));
}

async function main() {
  const inputPath = process.argv[2] ?? 'ai-regression-results.json';
  const raw = JSON.parse(await readFile(inputPath, 'utf8')) as unknown;
  const rows = resultRows(raw);

  if (rows.length === 0) {
    console.error('AI evaluation failed without result rows; treating as a regression-system failure.');
    process.exit(1);
  }

  const infrastructureRows = rows.filter(isInfrastructureFailure);
  const providerUnavailable = infrastructureRows.length === rows.length;
  const evidence = {
    status: providerUnavailable ? 'provider_unavailable' : 'regression_failure',
    total_results: rows.length,
    infrastructure_failures: infrastructureRows.length,
    git_sha: process.env.GITHUB_SHA ?? null,
  };
  await writeFile('ai-regression-provider-status.json', JSON.stringify(evidence, null, 2));

  if (!providerUnavailable) {
    console.error('Promptfoo failed for a non-infrastructure reason. The regression gate remains blocking.');
    process.exit(1);
  }

  console.warn(
    `Live AI evaluation unavailable because all ${rows.length} result(s) failed at the provider/infrastructure layer. Deterministic contracts remain authoritative for this run.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
