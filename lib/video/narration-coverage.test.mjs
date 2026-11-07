import test from 'node:test';
import assert from 'node:assert/strict';
import {narrationCoverage} from './narration-coverage.mjs';
test('caption timing and cue identifiers cannot supply missing spoken quantities',()=>{
 for(const caption of [
  'WEBVTT\n\n00:00:10.000 --> 00:00:11.000\nPay dollars\n',
  '10\n00:00:01,000 --> 00:00:02,000\nPay dollars\n',
  'WEBVTT\n\nNOTE ten dollars\n\n10\n00:00:01.000 --> 00:00:02.000\nPay dollars\n',
 ])assert.ok(narrationCoverage('Pay ten dollars',caption)<.9);
 assert.equal(narrationCoverage('Pay ten dollars','WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nPay $10\n'),1);
});
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
