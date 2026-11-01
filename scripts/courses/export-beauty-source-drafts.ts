/** Source-only canonical drafts. No inference, acceptance evidence, media or publication. */
import {writeFileSync} from 'node:fs';
import {UltimateAppendixAStandardsSource} from '../../lib/ultimate-course-builder/credential/appendix-a-source';
import {UltimatePlatformInstructionalGenerator} from '../../lib/ultimate-course-builder/adapters/platform-instructional-generator';
import {validateLessonBlueprint} from '../../lib/ultimate-course-builder/instructional/lesson-blueprint';
const output=process.argv[2];
if(!output) throw new Error('Output JSON path required');
const profile=await new UltimateAppendixAStandardsSource().load({programSlug:'nail-technician-apprenticeship'});
// The registered loader supplies original text, not an approved generated lesson.
if(profile.instructionalAuthoring || profile.lessonPresentation) throw new Error('SOURCE_ONLY_PROFILE_REQUIRED');
const generator=new UltimatePlatformInstructionalGenerator();
const drafts=[];
for(const competency of profile.competencies){
 const blueprint=await generator.sourceDraft({profile,competency});
 validateLessonBlueprint(blueprint,competency);
 if((blueprint as any).authoringEvidence) throw new Error('SOURCE_DRAFT_MUST_NOT_CLAIM_REVIEW');
 drafts.push({competencyId:competency.id,title:competency.title,blueprint,sourceRequirementIds:competency.authorityRequirementIds,practicalRequired:competency.requiresPracticalEvidence});
}
writeFileSync(output,JSON.stringify(drafts));
console.log(`Wrote ${drafts.length} source-only drafts; no publication or review asserted.`);
