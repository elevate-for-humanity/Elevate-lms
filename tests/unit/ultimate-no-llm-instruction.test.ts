import {describe,expect,it} from 'vitest';
import {UltimateAppendixAStandardsSource} from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import {UltimatePlatformInstructionalGenerator} from '../../lib/ultimate-course-builder/adapters/platform-instructional-generator';
import {UltimatePlatformAssessment} from '../../lib/ultimate-course-builder/adapters/platform-assessment';

describe('source-only Barber preparation',()=>{
  it('builds traceable structure, instructional draft, and multiple scenes without an LLM',async()=>{
    const profile=await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    const input={profile,competency:profile.competencies[0]};
    const generator=new UltimatePlatformInstructionalGenerator();
    const objectives=await generator.objectives(input) as Array<{authorityRequirementIds:string[]}>;
    expect(objectives[0].authorityRequirementIds[0]).toContain('RAPIDS:0030CB:APPENDIX_A:A');
    expect((await generator.prerequisites(input) as {reviewRequired:boolean}).reviewRequired).toBe(true);
    expect((await generator.teachingSequence(input) as {stages:unknown[]}).stages.length).toBeGreaterThan(5);
    const narration=await generator.instructorScript(input) as {script:string};
    expect(narration.script).toContain(profile.competencies[0].description);
    const storyboard=await generator.storyboard(input) as {scenes:Array<{sourceRequirementIds:string[]}>};
    expect(storyboard.scenes.length).toBeGreaterThan(2);
    expect(storyboard.scenes[0].sourceRequirementIds).toEqual(profile.competencies[0].authorityRequirementIds);
    const assessment=await new UltimatePlatformAssessment().generate({competency:profile.competencies[0]}) as {questions:Array<{choices:string[];objectiveIds:string[]}>};
    expect(assessment.questions[0].choices).toContain(profile.competencies[0].description);
    expect(assessment.questions[0].objectiveIds).toEqual(profile.competencies[0].authorityRequirementIds);
  });
});
