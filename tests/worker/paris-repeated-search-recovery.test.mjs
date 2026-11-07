import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverRepeatedSearch,checkInspectionBudget,inspectActionKey} from '../../lib/devstudio/paris-inspection-budget.mjs';

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
 assert.equal(recoverRepeatedSearch([inspectActionKey(search),inspectActionKey(search)],search,[observation]),null);
 assert.equal(checkInspectionBudget([inspectActionKey(search),inspectActionKey(search)],search).decision,'stop');
 assert.equal(recoverRepeatedSearch([inspectActionKey(search)],search,['Candidate filenames from the task branch: ["../secrets","lib/../secret","lib/.env"]']),null);
});
