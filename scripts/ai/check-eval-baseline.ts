import { readFile, writeFile } from 'node:fs/promises';

type Evidence = {
  suite: string;
  status: string;
  cases?: Array<{ case_key: string; passed: boolean }>;
};

type Baseline = {
  suite: string;
  version: number;
  approved_contract: string;
  minimum_case_count: number;
  minimum_pass_rate: number;
  required_cases: string[];
};

async function main() {
  const evidencePath = process.argv[2] ?? 'ai-regression-normalized.json';
  const baselinePath = process.argv[3] ?? 'evals/ai/course-factory/baseline.json';
  const [evidenceText, baselineText] = await Promise.all([
    readFile(evidencePath, 'utf8'),
    readFile(baselinePath, 'utf8'),
  ]);

  const evidence = JSON.parse(evidenceText) as Evidence;
  const baseline = JSON.parse(baselineText) as Baseline;
  const cases = evidence.cases ?? [];
  const passCount = cases.filter((item) => item.passed).length;
  const passRate = cases.length ? passCount / cases.length : 0;
  const observed = new Set(cases.map((item) => item.case_key));
  const missingRequiredCases = baseline.required_cases.filter((caseKey) => !observed.has(caseKey));

  const checks = {
    suite_matches: evidence.suite === baseline.suite,
    minimum_case_count: cases.length >= baseline.minimum_case_count,
    minimum_pass_rate: passRate >= baseline.minimum_pass_rate,
    required_cases_present: missingRequiredCases.length === 0,
  };
  const passed = Object.values(checks).every(Boolean);

  const comparison = {
    baseline_version: baseline.version,
    approved_contract: baseline.approved_contract,
    passed,
    checks,
    observed_case_count: cases.length,
    observed_pass_rate: passRate,
    missing_required_cases: missingRequiredCases,
  };
  await writeFile('ai-regression-baseline.json', JSON.stringify(comparison, null, 2));

  if (!passed) {
    console.error('AI regression baseline failed:', comparison);
    process.exit(1);
  }
  console.log(`AI regression baseline v${baseline.version} passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
