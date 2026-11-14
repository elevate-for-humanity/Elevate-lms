import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
test('only a dispatched repair is eligible for the signed workflow claim',()=>{
 const prepare=source.slice(source.indexOf('export async function prepareParisRepair('),source.indexOf('export async function publishParisRepair('));
 assert.match(prepare,/\.eq\('status','dispatched'\)\.select\('\*'\)/);
 assert.doesNotMatch(prepare,/\.in\('status',\['queued','dispatched'\]\)/);
 assert.match(prepare,/REPAIR_WORKFLOW_AUTHORITY_REQUIRED/);
 assert.match(prepare,/REPAIR_ALREADY_CLAIMED/);
});
