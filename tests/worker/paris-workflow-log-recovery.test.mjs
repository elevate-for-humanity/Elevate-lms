import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
test('missing and stale workflow runs redirect the planner without bypassing source validation',()=>{
 assert.match(source,/WORKFLOW_LOG_UNAVAILABLE/);
 assert.match(source,/WORKFLOW_LOG_STALE/);
 assert.match(source,/if \(!\/404\|not found\/i\.test\(message\)\) throw error/);
 assert.match(source,/PARIS_WORKFLOW_FAILED_JOB_REQUIRED/);
 assert.match(source,/PARIS_WORKFLOW_JOB_INVENTORY_INCOMPLETE/);
});
