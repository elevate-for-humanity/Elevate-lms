import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
test('functional test failures cannot be hidden behind a green required CI gate',()=>{
 const step=workflow.match(/      - name: Run (?:required )?Vitest suite[^\n]*\n[\s\S]*?(?=      - |\n  [a-z]|$)/)?.[0];
 assert.ok(step,'Functional test step is required');
 assert.doesNotMatch(step,/continue-on-error:\s*true/);
 assert.match(step,/run: pnpm exec vitest run\s*$/m,'Empty test discovery must fail');
 const gate=workflow.slice(workflow.indexOf('  ci-gate:'));
 assert.match(gate,/needs:\s*\[[^\]]*\bdiagnostics\b/);
 assert.ok(gate.includes('test "${{ needs.diagnostics.result }}" = "success"'));
});
