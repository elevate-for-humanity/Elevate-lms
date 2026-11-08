import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/compliance/rapids-integration.ts', import.meta.url), 'utf8');
const contract = readFileSync(new URL('../lib/apprenticeship/registered-program-contract.ts', import.meta.url), 'utf8');

test('RAPIDS sponsor name uses the registered contract legal name, not a missing sponsor field', () => {
  assert.match(contract, /sponsor:\s*\{\s*legalName:\s*string;/);
  assert.match(source, /sponsor_name:\s*context\.contract\.sponsor\.legalName/);
  assert.doesNotMatch(source, /context\.contract\.sponsor\.sponsor\b/);
});
