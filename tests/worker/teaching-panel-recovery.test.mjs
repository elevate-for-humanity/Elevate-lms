import test from 'node:test';
import assert from 'node:assert/strict';
import {applyTeachingStateVisibilityRepair, recoverTeachingVisibilityRepair} from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
import {fitTeachingPanel} from '../../lib/ultimate-course-builder/instructional/teaching-panel-layout.mjs';

const failure = {step:'finished_media_qa',severity:'error',code:'MEDIA_TEACHING_STATE_NOT_VISIBLE',message:'MEDIA_TEACHING_STATE_NOT_VISIBLE:scene:seg-08-demo:0:1280'};
const unchanged = {step:'scene_construction',severity:'error',code:'REPAIR_PRODUCER_UNCHANGED',message:'REPAIR_PRODUCER_UNCHANGED:scene_construction'};
function fixture() {
  const board = {scenes:[{id:'scene:seg-08-demo',teachingVisual:{transitionSeconds:0.08,visibilityRepair:{stepIndex:0,width:1280},steps:[{
    label:'Twelve-Month Balances',value:'cost remains $6,000, accumulated depreciation is $1,080 and carrying amount is $4,920.',narrationQuote:'cost remains $6,000',
  }]}}]};
  const producer = {certified:true,contractEvidence:{checkedAt:'2026-11-03T22:31:59Z'},scenes:{storyboard:{storyboard:board}}};
  return {artifacts:{scene_construction:producer,lesson_film_render:{certified:true}},steps:[
    {step:'scene_construction',state:'failed',completed_at:'2026-11-04T00:25:22Z'},
    {step:'finished_media_qa',state:'failed',completed_at:'2026-11-04T00:24:40Z',findings:[failure]},
    {step:'lesson_film_render',state:'passed',completed_at:'2026-11-03T23:05:48Z'},
  ],board};
}
const recover = f => recoverTeachingVisibilityRepair(f.artifacts,f.steps,[unchanged],v=>v?.certified===true);

test('current unchanged fade repair recovers measured feedback and produces a real layout change',()=>{
  const f=fixture(),state=recover(f);
  assert.equal(state.status,'diagnosed');
  assert.equal(state.directive.previous,f.artifacts.scene_construction);
  assert.deepEqual(state.directive.requirements,[{code:failure.code,message:failure.message}]);
  const fixed=applyTeachingStateVisibilityRepair(f.board,state.directive);
  assert.equal(fixed.scenes[0].teachingVisual.readableLayout,'bounded-v1');
  assert.deepEqual(fixed.scenes[0].teachingVisual.steps,f.board.scenes[0].teachingVisual.steps);
  assert.equal(f.board.scenes[0].teachingVisual.readableLayout,undefined);
  f.artifacts.scene_construction.scenes.storyboard.storyboard=fixed;
  assert.equal(recover(f),null);
});

test('recovery cannot replace a newer film, unrelated failure, uncertified producer or active directive',()=>{
  const f=fixture();f.steps[2].completed_at='2026-11-04T00:26:00Z';assert.equal(recover(f),null);
  for(const change of [
    f=>{f.artifacts.scene_construction.certified=false;},
    f=>{f.artifacts.scene_construction.contractEvidence.checkedAt='2026-11-04T00:26:00Z';},
    f=>{f.artifacts.__repairState={status:'diagnosed'};},
    f=>{f.steps[1].findings=[{...failure,code:'MEDIA_LICENSE_REQUIRED'}];},
    f=>{f.steps[1].completed_at='invalid';},
  ]) {const next=fixture();change(next);assert.equal(recover(next),null);}
});

test('bounded layout retains complete text and visible spacing; impossible content fails closed',()=>{
  // The actual canvas is exercised by encoded-frame acceptance. This width
  // model verifies the bounded line layout independently of font availability.
  const measure=(text,size)=>text.length*size*0.5;
  const fit=fitTeachingPanel('01 Twelve-Month Balances',fixture().board.scenes[0].teachingVisual.steps[0].value,measure);
  assert.ok(fit.valueSize<64);assert.ok(fit.valueSize>=44);assert.equal(fit.wordSpacing,4);
  assert.throws(()=>fitTeachingPanel('Label','a'.repeat(1000),measure),/TEACHING_PANEL_OVERFLOW/);
});
