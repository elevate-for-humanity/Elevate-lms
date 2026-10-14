const roles={concept_explanation:'mental_model',terminology:'system_diagram',instructor_example:'worked_example',demonstration:'worked_example',knowledge_check:'knowledge_check',assessment:'knowledge_check',reassessment:'knowledge_check',recap:'memory_recap'};
export function sceneRole(stage,fallback){return roles[stage]??fallback??'field_scenario';}
export function instructionView(board){
 return {...board,scenes:(board?.scenes??[]).map(s=>({...s,sceneType:sceneRole(s.stage,s.sceneType),dialogue:s.dialogue??s.teachingPoint??s.text??'',action:s.action??s.teachingPoint??s.dialogue??s.text??'',requiredVisualEvidence:s.requiredVisualEvidence??s.visualRequirement,shotSize:s.shotSize??'medium'}))};
}
export function repairDirective(failures,failedStep,target,previous,attempt){
 return {version:'verified-repair-v1',failedStep,target,attempt,requirements:failures.map(f=>({code:f.code,message:f.message})),previous, instructions:'Correct each listed failure in the responsible producer. Preserve lesson and competency IDs and authorized sources. Do not invent evidence or bypass a check. Return complete corrected content; it must pass independent review and pre-render validation.'};
}
