import type {StepHandler} from './build-runner';
import {buildObjectives} from '../instructional/objective-builder';
import {teachingSequence} from '../instructional/teaching-sequence';
import {requiredLearningExperience} from '../learning/experience-builder';

function competency(ctx:any){const id=String(ctx.buildId).split(':').pop();return ctx.profile.competencies.find((c:any)=>c.id===id)??ctx.profile.competencies[0];}
const artifact=(name:string,make:(ctx:any)=>unknown):StepHandler=>async(ctx)=>({artifacts:{[name]:make(ctx)}});
export const ultimateDefaultHandlers={
 standards_lock:artifact('standards',ctx=>({authority:ctx.profile.authority,version:ctx.profile.standardVersion,sources:ctx.profile.sourceDocuments,competency:competency(ctx)})),
 learning_objectives:artifact('objectives',ctx=>buildObjectives(competency(ctx))),
 prerequisites:artifact('prerequisites',()=>[]),
 teaching_sequence:artifact('sequence',()=>teachingSequence()),
 instructor_script:artifact('script',ctx=>({lesson:competency(ctx).title,status:'generation_required'})),
 storyboard:artifact('storyboard',ctx=>({lesson:competency(ctx).title,scenes:[],status:'generation_required'})),
 visual_assignment:artifact('visualRequirements',ctx=>({lesson:competency(ctx).title,status:'media_resolution_required'})),
 scene_construction:artifact('scenes',()=>({status:'composition_required'})),
 natural_narration:artifact('narration',()=>({tone:'neutral-calm',targetWpm:135,status:'generation_required'})),
 synchronization:artifact('timeline',()=>({continuousNarration:true,captions:true,status:'synchronization_required'})),
 active_teaching:artifact('learningExperience',()=>requiredLearningExperience()),
 mistakes_and_corrections:artifact('mistakeTraining',()=>({incorrectExample:true,correction:true})),
 assessment_alignment:artifact('assessment',()=>({objectiveCoverageRequired:1,status:'generation_required'})),
 lesson_film_render:artifact('film',()=>({status:'render_required'})),
 finished_media_qa:artifact('mediaQA',()=>({status:'inspection_required'})),
 instructional_qa:artifact('instructionalQA',()=>({status:'inspection_required'})),
 narration_qa:artifact('narrationQA',()=>({status:'inspection_required'})),
 learner_runthrough:artifact('learnerQA',()=>({status:'runthrough_required'})),
 selective_repair:artifact('repair',()=>({mode:'failed-components-only'})),
 credential_release:artifact('release',()=>({status:'traceability_review_required'})),
} satisfies Record<string,StepHandler>;
