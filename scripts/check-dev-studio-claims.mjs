#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
let failures = 0;
const fail = (message) => { console.error(`❌ ${message}`); failures += 1; };
const pass = (message) => console.log(`✅ ${message}`);

const languageRegistry = read('lib/devstudio/language-registry.ts');
const languageEntries = [...languageRegistry.matchAll(/\{ id: '[^']+', name: '[^']+', extensions:/g)].length;
if (languageEntries < 50) fail(`Dev Studio language registry has ${languageEntries} entries; 50+ claim requires >= 50.`);
else pass(`Dev Studio language registry supports ${languageEntries} maintained language modes.`);

const editor = read('components/studio/CodeEditor.tsx');
if (!editor.includes("detectDevStudioLanguage")) fail('CodeEditor is not wired to the canonical language registry.');
else pass('CodeEditor uses the canonical language registry.');

for (const path of ['northflank_marketing.json', 'northflank_admin.json', 'northflank_config.json']) {
  const config = JSON.parse(read(path));
  const deployment = config.deployment ?? {};
  const readiness = deployment.readinessProbe ?? deployment.healthCheck ?? null;
  if (!readiness?.enabled) fail(`${path}: no enabled readiness/health probe.`);
  else pass(`${path}: readiness/health probe enabled.`);
  const min = Number(deployment.replicas?.min ?? deployment.instances ?? 1);
  if (min < 1) fail(`${path}: production minimum replica count is invalid.`);
}

const marketing = read('apps/marketing/app/(marketing)/dev-studio/page.tsx');
if (/SOC 2 Certified/i.test(marketing)) fail('Marketing hard-codes SOC 2 certification instead of evidence-gating it.');
else pass('SOC 2 certification is not hard-coded.');
if (/10x Faster Dev/i.test(marketing)) fail('Marketing hard-codes a 10x productivity result instead of evidence-gating it.');
else pass('10x productivity result is not hard-coded.');

const migration = read('supabase/migrations/20260818221500_dev_studio_claim_evidence_and_benchmarks.sql');
for (const claim of ['language_modes_50_plus', 'productivity_10x', 'zero_downtime', 'soc2_certified']) {
  if (!migration.includes(`'${claim}'`)) fail(`Claim evidence schema is missing ${claim}.`);
}

if (failures) {
  console.error(`\n❌ Dev Studio claim gate failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log('\n✅ Dev Studio claim gate passed.');
