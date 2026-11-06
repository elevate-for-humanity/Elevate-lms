import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
test('PARIS planner receives durable inspection history and explicit no-repeat guidance',()=>{
 assert.match(source,/inspectionAlreadyPerformed: \[\.\.\.new Set\(inspectionHistory\)\]/);
 assert.match(source,/Do not repeat an inspectionAlreadyPerformed action/);
 assert.match(source,/checkInspectionBudget\(inspectionHistory, action\)/);
 assert.match(source,/PARIS_PLANNER_REPEATED_INSPECTION/);
});
