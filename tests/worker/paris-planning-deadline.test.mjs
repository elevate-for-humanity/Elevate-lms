import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
const workflow = readFileSync(new URL('../../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');

test('PARIS carries a workflow planning start time across durable continuations',()=>{
 assert.match(source,/startedAt\?: string/);
 assert.match(source,/saved\?\.startedAt \?\? new Date\(\)\.toISOString\(\)/);
 assert.match(source,/continuation\.save\(\{version:1,boundedCpuEdits:true,startedAt/);
});
test('PARIS checks remaining time before each long inference call',()=>{
 assert.match(source,/REPAIR_PLANNING_BUDGET_MS = 35 \* 60_000/);
 assert.match(source,/REPAIR_TURN_RESERVE_MS = REPAIR_INFERENCE_TIMEOUT_MS \+ REPAIR_MODEL_PROBE_TIMEOUT_MS \+ 30_000/);
 assert.match(source,/PARIS_REPAIR_PLANNING_DEADLINE_REACHED/);
 assert.match(source,/await checkpoint\(\);[\s\S]*?PARIS_REPAIR_PLANNING_DEADLINE_REACHED/);
 assert.match(workflow,/timeout-minutes: 40/);
});
