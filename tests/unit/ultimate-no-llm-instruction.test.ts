import {describe,expect,it} from 'vitest';
import {UltimateAppendixAStandardsSource} from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import {UltimatePlatformInstructionalGenerator} from '../../lib/ultimate-course-builder/adapters/platform-instructional-generator';

describe('source-only Barber preparation',()=>{
  it('builds traceable structure then requires authored instruction',async()=>{
    const profile=await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    const input={profile,competency:profile.competencies[0]};
    const generator=new UltimatePlatformInstructionalGenerator();
    const objectives=await generator.objectives(input) as Array<{authorityRequirementIds:string[]}>;
    expect(objectives[0].authorityRequirementIds[0]).toContain('RAPIDS:0030CB:APPENDIX_A:A');
    expect((await generator.prerequisites(input) as {reviewRequired:boolean}).reviewRequired).toBe(true);
    expect((await generator.teachingSequence(input) as {stages:unknown[]}).stages.length).toBeGreaterThan(5);
    await expect(generator.instructorScript(input)).rejects.toThrow('ULTIMATE_AUTHORED_INSTRUCTION_REQUIRED');
  });
});
