import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverCaptionCoverageInspection} from './caption-coverage-repair.mjs';
const findings=[{step:'synchronization',code:'REPAIR_PRODUCER_UNCHANGED',message:'REPAIR_PRODUCER_UNCHANGED:synchronization',severity:'error'}];
function fixture(){return {artifacts:{synchronization:{certified:true,contractEvidence:{checkedAt:'2026-11-07T03:56:00Z'}},lesson_film_render:{certified:true},natural_narration:{narration:{segments:[{text:'Invest $10,000',captions:[{text:'invest ten thousand dollars'}]}]}}},steps:[
 {step:'lesson_film_render',state:'passed',completed_at:'2026-11-07T04:01:00Z'},
 {step:'finished_media_qa',state:'failed',completed_at:'2026-11-07T04:25:00Z',findings:[{step:'finished_media_qa',severity:'error',code:'Media quality gate failed',message:'Media quality gate failed: captions do not cover rendered narration'}]},
 {step:'synchronization',state:'failed',completed_at:'2026-11-07T04:41:00Z'},
]};}
const certified=a=>a?.certified===true;
test('format-equivalent certified narration restores an inspector retry, not a producer rerender or passed QA',()=>{
 const {artifacts,steps}=fixture();const result=recoverCaptionCoverageInspection(artifacts,steps,findings,certified);
 assert.equal(result.directive.target,'finished_media_qa');assert.equal(result.status,'diagnosed');
 assert.equal(result.directive.previousTarget,'synchronization');assert.ok(!('passed' in result));
});
test('missing certification, chronology, true content loss or additional QA failures cannot enter inspector recovery',()=>{
 for(const change of [
  f=>f.artifacts.synchronization.certified=false,
  f=>f.artifacts.lesson_film_render.certified=false,
  f=>f.steps[0].completed_at='2026-11-07T05:00:00Z',
  f=>f.steps[1].completed_at='unknown',
  f=>f.artifacts.natural_narration.narration.segments[0].captions[0].text='invest one hundred dollars',
  f=>f.steps[1].findings.push({severity:'error',code:'MEDIA_LICENSE_REQUIRED',message:'missing license'}),
  f=>f.artifacts.__repairState={status:'diagnosed',directive:{target:'storyboard'}},
 ]){const f=fixture();change(f);assert.equal(recoverCaptionCoverageInspection(f.artifacts,f.steps,findings,certified),null);}
});
