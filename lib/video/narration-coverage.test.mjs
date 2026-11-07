import test from 'node:test';
import assert from 'node:assert/strict';
import {narrationCoverage} from './narration-coverage.mjs';
test('authored money and independently recognized spoken quantities retain full caption coverage',()=>{
 const script='The owner invested $10,000 and paid $5,000 for equipment.';
 const spoken='the owner invested ten thousand dollars and paid five thousand dollars for equipment';
 assert.equal(narrationCoverage(script,spoken),1);
 assert.equal(narrationCoverage(spoken,script),1);
});
test('missing text, changed values and omitted negation still fail the unchanged 90 percent threshold',()=>{
 for(const [script,spoken] of [
  ['Pay $10,000','Pay $100,000'],
  ['Pay -$1,000','Pay $1,000'],
  ['Do not charge a fee','Do charge a fee'],
  ['Reconcile every account before finalizing the month end statements','Reconcile accounts'],
 ])assert.ok(narrationCoverage(script,spoken)<.9);
 assert.equal(narrationCoverage('Auditable statements',''),0);
});
