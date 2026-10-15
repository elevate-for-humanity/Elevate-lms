const roles={concept_explanation:'mental_model',terminology:'system_diagram',instructor_example:'worked_example',demonstration:'worked_example',knowledge_check:'knowledge_check',assessment:'knowledge_check',reassessment:'knowledge_check',recap:'memory_recap'};
export function sceneRole(stage,fallback){return roles[stage]??fallback??'field_scenario';}
export function instructionView(board){
 return {...board,scenes:(board?.scenes??[]).map(s=>({...s,sceneType:sceneRole(s.stage,s.sceneType),dialogue:s.dialogue??s.teachingPoint??s.text??'',action:s.action??s.teachingPoint??s.dialogue??s.text??'',requiredVisualEvidence:s.requiredVisualEvidence??s.visualRequirement,shotSize:s.shotSize??'medium'}))};
}
export function repairDirective(failures,failedStep,target,previous,attempt){
 return {version:'verified-repair-v1',failedStep,target,attempt,requirements:failures.map(f=>({code:f.code,message:f.message})),previous, instructions:'Correct each listed failure in the responsible producer. Preserve lesson and competency IDs and authorized sources. Do not invent evidence or bypass a check. Return complete corrected content; it must pass independent review and pre-render validation.'};
}


/**
 * Apply a focused, presentation-only repair for an encoded title-readability
 * finding. The authored instructional text and licensed visual assignment stay
 * intact; only the failed scene's title scale changes for the renderer.
 */
export function applySceneTitleReadabilityRepair(storyboard, directive) {
  if (directive?.target !== 'scene_construction') return storyboard;
  const requirements = Array.isArray(directive.requirements) ? directive.requirements : [];
  const affectedScenes = new Set();
  for (const requirement of requirements) {
    const code = String(requirement?.code ?? '');
    const message = String(requirement?.message ?? '');
    if (!/^MEDIA_TEXT_UNREADABLE/.test(code) && !/^MEDIA_TEXT_UNREADABLE/.test(message)) continue;
    const match = (message + '\n' + code).match(/MEDIA_TEXT_UNREADABLE:(\d+):(\d+)/);
    if (!match) throw new Error('MEDIA_TEXT_REPAIR_SCENE_REQUIRED');
    const sceneIndex = Number(match[1]) - 1;
    const width = Number(match[2]);
    if (!Number.isSafeInteger(width) || width < 1) throw new Error('MEDIA_TEXT_REPAIR_WIDTH_REQUIRED');
    if (!Array.isArray(storyboard?.scenes) || !Number.isSafeInteger(sceneIndex) ||
        sceneIndex < 0 || sceneIndex >= storyboard.scenes.length) {
      throw new Error('MEDIA_TEXT_REPAIR_SCENE_OUT_OF_RANGE');
    }
    affectedScenes.add(sceneIndex);
  }
  if (!affectedScenes.size) return storyboard;
  const titleFontSize = Number(directive.attempt) >= 2 ? 144 : 128;
  return {
    ...storyboard,
    scenes: storyboard.scenes.map((scene, index) =>
      affectedScenes.has(index) ? { ...scene, titleFontSize } : scene),
  };
}
