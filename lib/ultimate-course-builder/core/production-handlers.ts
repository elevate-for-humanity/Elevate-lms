import type {StepHandler} from './build-runner';import type {UltimateRuntime} from './runtime';import {requiredLearningExperience} from '../learning/experience-builder';
const comp=(ctx:any)=>ctx.profile.competencies.find((c:any)=>String(ctx.buildId).endsWith(':'+c.id))??ctx.profile.competencies[0];
const evidence=(ctx:any)=>({profile:ctx.profile,competency:comp(ctx),prior:ctx.artifacts});
export function createProductionHandlers(runtime:UltimateRuntime):Record<string,StepHandler>{return {
standards_lock:async ctx=>({artifacts:{credential:await runtime.credential.load(ctx.profile.id),workforce:await runtime.workforce.load({socCodes:ctx.profile.socCodes??[],jurisdiction:ctx.profile.jurisdiction})}}),
learning_objectives:async ctx=>({artifacts:{objectives:await runtime.instructional.objectives(evidence(ctx))}}),
prerequisites:async ctx=>({artifacts:{prerequisites:await runtime.instructional.prerequisites(evidence(ctx))}}),
teaching_sequence:async ctx=>({artifacts:{sequence:await runtime.instructional.teachingSequence(evidence(ctx))}}),
instructor_script:async ctx=>({artifacts:{script:await runtime.instructional.instructorScript(evidence(ctx))}}),
storyboard:async ctx=>({artifacts:{storyboard:await runtime.instructional.storyboard(evidence(ctx))}}),
visual_assignment:async ctx=>({artifacts:{media:await runtime.media.find({courseId:ctx.courseId,competency:comp(ctx),storyboard:ctx.artifacts.storyboard,artifacts:ctx.artifacts})}}),
scene_construction:async ctx=>({artifacts:{scenes:{storyboard:ctx.artifacts.storyboard,media:ctx.artifacts.visual_assignment,loop:false}}}),
natural_narration:async ctx=>({artifacts:{narration:await runtime.narration.generate({lessonId:comp(ctx).id,script:ctx.artifacts.instructor_script?.script??ctx.artifacts.instructor_script,artifacts:ctx.artifacts,tone:'neutral-calm',targetWpm:135})}}),
synchronization:async ctx=>({artifacts:{timeline:{narration:ctx.artifacts.natural_narration,scenes:ctx.artifacts.scene_construction,captions:true,continuousNarration:true}}}),
active_teaching:async ctx=>({artifacts:{learningExperience:requiredLearningExperience(),objectives:ctx.artifacts.learning_objectives}}),
mistakes_and_corrections:async ctx=>({artifacts:{mistakes:{competency:comp(ctx).id,source:ctx.artifacts.instructor_script,incorrectExample:true,correction:true}}}),
assessment_alignment:async ctx=>({artifacts:{assessment:await runtime.assessment.generate({competency:comp(ctx),objectives:ctx.artifacts.learning_objectives,learning:ctx.artifacts.active_teaching,script:ctx.artifacts.instructor_script})}}),
lesson_film_render:async ctx=>({artifacts:{render:await runtime.renderer.render({lessonId:comp(ctx).id,courseTitle:ctx.profile.title,artifacts:ctx.artifacts})}}),
finished_media_qa:async ctx=>({artifacts:{mediaQA:{artifact:ctx.artifacts.lesson_film_render,requiresFinishedArtifactInspection:true}}}),
instructional_qa:async ctx=>({artifacts:{instructionalQA:{objectives:ctx.artifacts.learning_objectives,learning:ctx.artifacts.active_teaching,assessment:ctx.artifacts.assessment_alignment,requiresInstructionalInspection:true}}}),
narration_qa:async ctx=>({artifacts:{narrationQA:{narration:ctx.artifacts.natural_narration,requiresRenderedAudioInspection:true}}}),
learner_runthrough:async ctx=>({artifacts:{learnerQA:{film:ctx.artifacts.lesson_film_render,experience:ctx.artifacts.active_teaching,assessment:ctx.artifacts.assessment_alignment,requiresRuntimeRunthrough:true}}}),
selective_repair:async ctx=>({artifacts:{repair:{findings:ctx.findings,mode:'failed-components-only',rebuildPassingComponents:false}}}),
credential_release:async ctx=>({artifacts:{release:{courseId:ctx.courseId,competencyId:comp(ctx).id,requirements:comp(ctx).authorityRequirementIds,objectives:ctx.artifacts.learning_objectives,assessment:ctx.artifacts.assessment_alignment,film:ctx.artifacts.lesson_film_render,releaseEvidenceRecorded:true}}})
};}
