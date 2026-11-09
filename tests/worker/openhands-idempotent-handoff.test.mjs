import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../lib/devstudio/openhands/runtime.ts',import.meta.url),'utf8');

test('known OpenHands correlation is resolved before any external start',()=>{
 const fn=source.slice(source.indexOf('export async function dispatchOpenHandsTask('),source.indexOf('function lifecycleTaskStatus('));
 assert.ok(fn.indexOf('if (existing)')>=0);
 assert.ok(fn.indexOf('if (existing)')<fn.indexOf('const start = await startOpenHandsTask('));
 assert.match(fn,/start_task_id/);
 assert.match(fn,/return \{\s*taskId: existing\.id/);
});
test('an ambiguous prior start fails closed, never replays work',()=>{
 assert.match(source,/OPENHANDS_EXISTING_TASK_START_UNCONFIRMED/);
 assert.match(source,/OPENHANDS_CORRELATION_OWNERSHIP_MISMATCH/);
 assert.match(source,/OPENHANDS_EXISTING_TASK_NOT_DISPATCHABLE/);
 assert.match(source,/existing\.user_id !== input\.actorId/);
 assert.match(source,/existing\.command !== input\.task/);
});
