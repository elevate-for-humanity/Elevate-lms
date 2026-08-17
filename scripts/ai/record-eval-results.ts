import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

type CaseDefinition = {
  id: string;
  suite: string;
  category: string;
  description: string;
  prompt: string;
  expected_criteria: Record<string, unknown>;
  version: number;
};

type NormalizedResult = {
  case_key: string;
  description: string;
  passed: boolean;
  score: number | null;
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  output_text: string | null;
  assertion_results: unknown[];
  raw: Record<string, unknown>;
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstArray(value: unknown): unknown[] {
  const root = asObject(value);
  if (!root) return [];
  if (Array.isArray(root.results)) return root.results;
  const nested = asObject(root.results);
  if (nested && Array.isArray(nested.results)) return nested.results;
  if (Array.isArray(root.table)) return root.table;
  return [];
}

function stringValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function numberValue(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function booleanValue(...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return false;
}

function normalize(raw: unknown, cases: CaseDefinition[]): NormalizedResult[] {
  const rows = firstArray(raw);
  return rows.map((entry, index) => {
    const row = asObject(entry) ?? {};
    const test = asObject(row.testCase) ?? asObject(row.test) ?? {};
    const response = asObject(row.response) ?? {};
    const grading = asObject(row.gradingResult) ?? asObject(row.grading) ?? {};
    const description =
      stringValue(row.description, test.description, grading.description) ?? `case-${index + 1}`;
    const def = cases.find((candidate) => candidate.description === description) ?? cases[index];
    const assertionResults = Array.isArray(grading.componentResults)
      ? grading.componentResults
      : Array.isArray(row.assertionResults)
        ? row.assertionResults
        : [];

    return {
      case_key: def?.id ?? description,
      description,
      passed: booleanValue(row.success, row.pass, grading.pass, grading.success),
      score: numberValue(row.score, grading.score),
      provider: stringValue(row.provider, response.provider),
      model: stringValue(row.model, response.model),
      latency_ms: numberValue(row.latencyMs, response.latencyMs, response.latency),
      output_text: stringValue(row.output, response.output),
      assertion_results: assertionResults,
      raw: row,
    };
  });
}

function priorityForAssertion(assertion: unknown): 'P0' | 'P1' | 'P2' | 'P3' | 'P4' {
  const obj = asObject(assertion) ?? {};
  const type = stringValue(obj.type, asObject(obj.assertion)?.type)?.toLowerCase() ?? '';
  if (type.includes('llm') || type.includes('rubric') || type.includes('similar')) return 'P3';
  if (type.includes('security') || type.includes('auth')) return 'P2';
  if (type.includes('database') || type.includes('workflow') || type.includes('route')) return 'P1';
  if (type.includes('baseline') || type.includes('regression')) return 'P4';
  return 'P0';
}

async function main() {
  const resultPath = process.argv[2] ?? 'ai-regression-results.json';
  const casePath = process.argv[3] ?? 'evals/ai/course-factory/cases.json';
  const suite = process.env.AI_EVAL_SUITE ?? 'course-factory';

  const [rawText, casesText] = await Promise.all([
    readFile(resultPath, 'utf8'),
    readFile(casePath, 'utf8'),
  ]);
  const raw = JSON.parse(rawText) as unknown;
  const cases = JSON.parse(casesText) as CaseDefinition[];
  const normalized = normalize(raw, cases);
  const passed = normalized.length > 0 && normalized.every((result) => result.passed);

  const evidence = {
    suite,
    git_sha: process.env.GITHUB_SHA ?? null,
    branch: process.env.GITHUB_REF_NAME ?? null,
    trigger: process.env.GITHUB_EVENT_NAME ?? 'local',
    status: passed ? 'passed' : 'failed',
    cases: normalized,
  };
  await writeFile('ai-regression-normalized.json', JSON.stringify(evidence, null, 2));

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.log('Supabase evaluation persistence skipped: service-role credentials are not configured.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const caseRows = cases.map((testCase) => ({
    id: testCase.id,
    suite: testCase.suite,
    category: testCase.category,
    prompt: testCase.prompt,
    expected_criteria: testCase.expected_criteria,
    version: testCase.version,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error: caseError } = await supabase.from('ai_eval_cases').upsert(caseRows, { onConflict: 'id' });
  if (caseError) throw caseError;

  const { data: run, error: runError } = await supabase
    .from('ai_eval_runs')
    .insert({
      suite,
      git_sha: evidence.git_sha,
      branch: evidence.branch,
      trigger: evidence.trigger,
      status: evidence.status,
      completed_at: new Date().toISOString(),
      metadata: { source: 'promptfoo', normalized_result_count: normalized.length },
    })
    .select('id')
    .single();
  if (runError || !run) throw runError ?? new Error('Failed to create ai_eval_runs record');

  for (const result of normalized) {
    const p3Assertions = result.assertion_results.filter((assertion) => priorityForAssertion(assertion) === 'P3');
    const { data: saved, error: resultError } = await supabase
      .from('ai_eval_results')
      .insert({
        run_id: run.id,
        case_id: cases.some((testCase) => testCase.id === result.case_key) ? result.case_key : null,
        case_key: result.case_key,
        passed: result.passed,
        score: result.score,
        p0_contract_passed: result.passed,
        p1_workflow_passed: null,
        p2_security_passed: null,
        p3_quality_passed: p3Assertions.length ? result.passed : null,
        p4_regression_passed: null,
        provider: result.provider,
        model: result.model,
        latency_ms: result.latency_ms,
        output_text: result.output_text,
        metrics: {
          description: result.description,
          assertions: result.assertion_results,
        },
      })
      .select('id')
      .single();
    if (resultError || !saved) throw resultError ?? new Error('Failed to create ai_eval_results record');

    if (!result.passed) {
      const failedAssertions = result.assertion_results.filter((assertion) => {
        const obj = asObject(assertion) ?? {};
        return obj.pass === false || obj.success === false;
      });
      const failures = (failedAssertions.length ? failedAssertions : [{}]).map((assertion, index) => ({
        result_id: saved.id,
        priority: priorityForAssertion(assertion),
        code: `AI_EVAL_ASSERTION_${index + 1}`,
        message: stringValue(asObject(assertion)?.reason, asObject(assertion)?.message) ?? 'AI regression assertion failed',
        details: asObject(assertion) ?? {},
      }));
      const { error: failureError } = await supabase.from('ai_eval_failures').insert(failures);
      if (failureError) throw failureError;
    }
  }

  console.log(`Recorded AI regression run ${run.id} with ${normalized.length} result(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
