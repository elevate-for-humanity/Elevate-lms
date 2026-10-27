import {describe,it,expect} from 'vitest';
import {AuthorControlPolicy} from '../../lib/ultimate-course-builder/authoring/author-control-policy';
import {executableRepairTargets,type CourseRepairPlan} from '../../lib/ultimate-course-builder/repair/course-repair-plan';
import {evaluateAccessibility} from '../../lib/ultimate-course-builder/accessibility/accessibility-contract';
import type {UltimateCoursePackage} from '../../lib/ultimate-course-builder/release/course-package';

describe('Ultimate professional runtime contracts',()=>{
  it('prevents regeneration of locked approved artifacts',()=>{
    const policy=new AuthorControlPolicy('LOCKED');
    expect(policy.canRepair({artifactVersionId:'v1',artifactType:'narration',locked:true,approvalStatus:'approved'})).toEqual({allowed:false,reason:'ARTIFACT_LOCKED'});
  });
  it('repairs only failed unlocked artifacts',()=>{
    const plan:CourseRepairPlan={buildId:'b',createdAt:new Date(0).toISOString(),preserveCourseIdentity:true,preservePassingArtifacts:true,decisions:[
      {logicalKey:'script',owningStage:'instructor_script',disposition:'PASS',reason:'approved',locked:false,downstreamLogicalKeys:[]},
      {logicalKey:'narration',owningStage:'natural_narration',disposition:'REPAIR',reason:'robotic',locked:false,downstreamLogicalKeys:['sync','render']},
      {logicalKey:'assessment',owningStage:'assessment_alignment',disposition:'REPLACE',reason:'coverage',locked:true,downstreamLogicalKeys:[]}
    ]};
    expect(executableRepairTargets(plan)).toEqual([{step:'natural_narration',logicalKey:'narration',disposition:'REPAIR'}]);
  });
  it('blocks release on critical accessibility failure and recovers after repair',()=>{
    const base={captions:true,transcript:true,altText:true,keyboardOperation:true,focusOrder:true,semanticHeadings:true,colorContrast:true,nonColorMeaning:true,screenReaderLabels:true,reducedMotion:true,accessibleInteractionFallback:true};
    expect(evaluateAccessibility({...base,keyboardOperation:false}).critical).toBe(true);
    expect(evaluateAccessibility(base)).toEqual({pass:true,critical:false,failures:[]});
  });
  it('uses one canonical package representation',()=>{
    const pkg:UltimateCoursePackage={schemaVersion:1,course:{id:'c',title:'Course'},profile:{id:'p',title:'Credential',authority:'Issuer',standardVersion:'1',sourceDocuments:[],competencies:[]},modules:[],lessons:[],release:{buildId:'b',releasedAt:new Date(0).toISOString(),traceabilityComplete:true,accessibilityPassed:true}};
    expect(pkg.schemaVersion).toBe(1);expect(pkg.release.traceabilityComplete).toBe(true);
  });
});