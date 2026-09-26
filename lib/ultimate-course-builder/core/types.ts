export const ULTIMATE_BUILD_STEPS = [
'standards_lock','learning_objectives','prerequisites','teaching_sequence','instructor_script','storyboard','visual_assignment','scene_construction','natural_narration','synchronization','active_teaching','mistakes_and_corrections','assessment_alignment','lesson_film_render','finished_media_qa','instructional_qa','narration_qa','learner_runthrough','selective_repair','credential_release'
] as const;
export type UltimateBuildStep = typeof ULTIMATE_BUILD_STEPS[number];
export type UltimateStepState = 'pending'|'running'|'passed'|'failed'|'blocked';
export interface UltimateCredentialProfile { id:string; title:string; authority:string; jurisdiction?:string; standardVersion:string; effectiveDate?:string; sourceDocuments:string[]; competencies:UltimateCompetency[]; socCodes?:string[]; examBlueprint?:{domains:Array<{id:string;title:string;weight?:number}>;passingScore?:number}; trainingRequirements?:{instructionalHours?:number;ojlHours?:number;clinicalHours?:number;externshipHours?:number}; }
export interface UltimateCompetency { id:string; title:string; description:string; type:'knowledge'|'decision'|'procedure'|'practical_skill'; authorityRequirementIds:string[]; requiresDemonstration:boolean; requiresPracticalEvidence:boolean; criticalSafetyCompetency?:boolean; }
export interface UltimateBuildContext { buildId:string; courseId:string; profile:UltimateCredentialProfile; currentStep:UltimateBuildStep; stepStates:Record<UltimateBuildStep,UltimateStepState>; }
