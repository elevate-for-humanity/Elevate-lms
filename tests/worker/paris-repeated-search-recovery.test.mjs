import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverRepeatedSearch,recoverRepeatedInspection,checkInspectionBudget,inspectActionKey} from '../../lib/devstudio/paris-inspection-budget.mjs';

const search={type:'search',query:'ai.command unknown failure'};
const observation='SEARCH ai.command unknown failure: no content matches. Candidate filenames from the task branch: ["lib/ai/command-intent.ts","lib/ai/runtime/command-executor.ts"]. Read an exact file before proposing a change.';

test('a duplicate empty search selects an already discovered exact file instead of repeating search',()=>{
 const result=recoverRepeatedSearch([inspectActionKey(search)],search,[observation]);
 assert.deepEqual(result,{type:'read',path:'lib/ai/command-intent.ts'});
 assert.equal(checkInspectionBudget([inspectActionKey(search)],result).decision,'inspect');
});

test('previously inspected files are skipped and no protected path is selected',()=>{
 const history=[inspectActionKey(search),'read:lib/ai/command-intent.ts'];
 const result=recoverRepeatedSearch(history,search,[observation]);
 assert.deepEqual(result,{type:'read',path:'lib/ai/runtime/command-executor.ts'});
});

test('new searches, non-search actions and malformed or missing evidence do not force a read',()=>{
 assert.equal(recoverRepeatedSearch([],search,[observation]),null);
 assert.equal(recoverRepeatedSearch(['read:lib/x'],{type:'read',path:'lib/x'},[observation]),null);
 assert.equal(recoverRepeatedSearch([inspectActionKey(search)],search,['SEARCH: no candidates']),null);
 assert.equal(recoverRepeatedSearch([inspectActionKey(search)],search,['Candidate filenames from the task branch: [not-json]']),null);
});

test('third duplicate and unsafe candidates remain blocked',()=>{
 assert.deepEqual(recoverRepeatedSearch([inspectActionKey(search),inspectActionKey(search)],search,[observation]),{type:'read',path:'lib/ai/command-intent.ts'});
 assert.equal(checkInspectionBudget([inspectActionKey(search),inspectActionKey(search)],search).decision,'stop');
 assert.equal(recoverRepeatedSearch([inspectActionKey(search)],search,['Candidate filenames from the task branch: ["../secrets","lib/../secret","lib/.env"]']),null);
});

test('repeated directory listing and repeated source reads progress to an authenticated inventory alternative',()=>{
  const history=['list:lib/','read:lib/api-client.ts'];
  const list='LIST lib/: [{"path":"lib/api-client.ts","type":"file"},{"path":"lib/api-error-handler.ts","type":"file"}]';
  assert.deepEqual(recoverRepeatedInspection(history,{type:'list',path:'lib/'},[list]),
    {type:'read',path:'lib/api-error-handler.ts'});
  assert.deepEqual(recoverRepeatedInspection(history,{type:'read',path:'lib/api-client.ts'},[list]),
    {type:'read',path:'lib/api-error-handler.ts'});
});

test('previously inspected failed-job logs use other known source, not an invented run ID',()=>{
  const history=['workflow_log:41920417830:128397380474'];
  const log={type:'workflow_log',runId:41920417830,jobId:128397380474};
  assert.deepEqual(recoverRepeatedInspection(history,log,[observation]),
    {type:'read',path:'lib/ai/command-intent.ts'});
});
