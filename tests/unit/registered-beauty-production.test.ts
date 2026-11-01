import {describe,it,expect,vi} from 'vitest';
vi.mock('@/lib/ultimate-course-builder/instructional/google-lesson-author',()=>({authorGoogleLesson:vi.fn(),generateVertexLessonJson:vi.fn(),validateGoogleAuthoringEvidence:vi.fn(),GOOGLE_LESSON_AUTHOR_VERSION:'unused'}));
vi.mock('@/lib/ultimate-course-builder/instructional/teaching-recaps',()=>({addFreshTeachingRecaps:(blueprint:unknown)=>blueprint}));
import {UltimateAppendixAStandardsSource} from '@/lib/ultimate-course-builder/credential/appendix-a-source';
import {UltimatePlatformInstructionalGenerator} from '@/lib/ultimate-course-builder/adapters/platform-instructional-generator';
import {validateLessonBlueprint} from '@/lib/ultimate-course-builder/instructional/lesson-blueprint';
import {verifyRegisteredProfile} from '@/lib/ultimate-course-builder/credential/verify-registered-profile';

describe('Registered beauty instruction production',()=>{
 for(const [slug,count,hours,code] of [['esthetician-apprenticeship',20,300,'2089CB'],['nail-technician-apprenticeship',19,210,'2090CB']] as const){
  it(`${slug}: authoring consumes each source and preserves the registered contract`,async()=>{
   const profile=await new UltimateAppendixAStandardsSource().load({programSlug:slug});
   expect(profile.trainingRequirements.instructionalHours).toBe(hours);
   expect(profile.competencies).toHaveLength(count);
   expect(verifyRegisteredProfile(profile).rapidsCode).toBe(code);
   const generator=new UltimatePlatformInstructionalGenerator();
   for(const competency of profile.competencies){
    const blueprint=await generator.blueprint({profile,competency});
    expect(()=>validateLessonBlueprint(blueprint,competency)).not.toThrow();
    expect(blueprint.assessment.passingScore).toBe(80);
    expect(blueprint.assessment.practicalRubric).toBeTruthy();
    const narration=blueprint.segments.map(s=>s.text).join(' ');
    expect(narration).not.toMatch(/Authorized course content:|"provenance"|<h3>/);
    expect(blueprint.assessment.questions[0].choices).not.toContain('Skip the required process and rely only on memory.');
   }
  });
 }
});
