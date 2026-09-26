import type {StepHandler} from './build-runner';import type {UltimateRuntime} from './runtime';import {buildObjectives} from '../instructional/objective-builder';import {teachingSequence} from '../instructional/teaching-sequence';import {requiredLearningExperience} from '../learning/experience-builder';
const comp=(ctx:any)=>ctx.profile.competencies.find((c:any)=>String(ctx.buildId).endsWith(':'+c.id))??ctx.profile.competencies[0];
export function createProductionHandlers(runtime:UltimateRuntime):Record<string,StepHandler>{return {
standards_lock:async ctx=>({artifacts:{credential:await runtime.credential.load(ctx.profile.id),workforce:await runtime.workforce.load({socCodes:ctx.profile.socCodes??[],jurisdiction:ctx.profile.jurisdiction})}}),
learning_objectives:async ctx=>({artifacts:{objectives:buildObjectives(comp(ctx))}}),
prerequisites:async()=>({artifacts:{prerequisites:[]}}),
teaching_sequence:async()=>({artifacts:{sequence:teachingSequence()}}),
instructor_script:async ctx=>({artifacts:{script:{competency:comp(ctx).title,requirements:comp(ctx).authorityRequirementIds}}}),
storyboard:async ctx=>({artifacts:{storyboard:{competency:comp(ctx).id,status:'planned'}}}),
visual_assignment:async ctx=>({artifacts:{media:await runtime.media.find({competency:comp(ctx),artifacts:ctx.artifacts})}}),
scene_construction:async ctx=>({artifacts:{scenes:{media:ctx.artifacts.visual_assignment??{},loop:false}}}),
natural_narration:async ctx=>({artifacts:{narration:await runtime.narration.generate({lessonId:comp(ctx).id,artifacts:ctx.artifacts,tone:'neutral-calm',targetWpm:135})}}),
synchronization:async ctx=>({artifacts:{timeline:{narration:ctx.artifacts.natural_narration,scenes:ctx.artifacts.scene_construction,captions:true}}}),
active_teaching:async()=>({artifacts:{learningExperience:requiredLearningExperience()}}),
mistakes_and_corrections:async()=>({artifacts:{mistakes:{incorrectExample:true,correction:true}}}),
assessment_alignment:async ctx=>({artifacts:{assessment:await runtime.assessment.generate({competency:comp(ctx),artifacts:ctx.artifacts})}}),
lesson_film_render:async ctx=>({artifacts:{render:await runtime.renderer.render({lessonId:comp(ctx).id,artifacts:ctx.artifacts})}}),
finished_media_qa:async ctx=>({artifacts:{mediaQA:{artifact:ctx.artifacts.lesson_film_render,status:'observed'}}}),
instructional_qa:async ctx=>({artifacts:{instructionalQA:{learning:ctx.artifacts.active_teaching,status:'observed'}}}),
narration_qa:async ctx=>({artifacts:{narrationQA:{narration:ctx.artifacts.natural_narration,status:'observed'}}}),
learner_runthrough:async ctx=>({artifacts:{learnerQA:{lesson:ctx.artifacts.lesson_film_render,experience:ctx.artifacts.active_teaching,status:'observed'}}}),
selective_repair:async()=>({artifacts:{repair:{mode:'observation-only-in-initial-run'}}}),
credential_release:async ctx=>({artifacts:{release:{courseId:ctx.courseId,competencyId:comp(ctx).id,status:'built'}}})
};}
