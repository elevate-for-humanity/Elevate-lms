const roles={concept_explanation:'mental_model',terminology:'system_diagram',instructor_example:'worked_example',demonstration:'worked_example',knowledge_check:'knowledge_check',assessment:'knowledge_check',reassessment:'knowledge_check',recap:'memory_recap'};
export function sceneRole(stage,fallback,identity='',text=''){
 // A safety summary or question still fulfills its authored recap/check role.
 if(roles[stage]==='memory_recap'||roles[stage]==='knowledge_check')return roles[stage];
 // Retain an authored safety role. Recognize explicitly named safety teaching
 // moments only when their own narration contains protective instructions.
 const namedSafety=/\b(?:safety|sanitation|hygiene|hygienic|disinfection|decontamination|cross contamination|infection control)\b/i.test(String(identity).replace(/[-_]/g,' '));
 const protectiveInstruction=/\b(?:gloves|protective|disinfect(?:ed|ing|ion)?|saniti[sz](?:e|ed|ing)|hygienically|clean(?:ed|ing)? (?:hands|linens|spatulas|supplies|tools|brushes|surfaces)|wash (?:your )?hands|single[- ]use (?:applicators?|sponges?|items)|sanitation|ppe)\b/i.test(String(text));
 // A generated scene can retain a neutral stage title such as
 // "demonstration" even after a verified repair adds a complete chemical
 // safety procedure. Require both protective setup and an explicit hazard
 // response before treating an unnamed scene as safety teaching; a lone word
 // such as "gloves" is still insufficient.
 const explicitHazardResponse=/\b(?:stop(?: the service)? (?:immediately )?(?:for|if|when)[^.!?]{0,80}(?:discomfort|burning|unsafe|reaction|irritation|pain)|rinse(?: thoroughly| immediately)?[^.!?]{0,80}(?:burning|reaction|safety)|follow (?:the )?(?:product|manufacturer)[^.!?]{0,80}safety (?:directions|instructions))\b/i.test(String(text));
 const narratedSafetyProcedure=/\b(?:safety|sanitation|hygiene) (?:standards|protocols|procedures)\b/i.test(String(text));
 const allergyPrecaution=/\b(?:skin (?:allergy )?test(?:ing)?|allergy test(?:ing)?)\b/i.test(String(text))&&/\bdo not proceed[^.!?]{0,160}(?:reaction|irritated|damaged|infected)\b/i.test(String(text));
 // Refrigerant precautions do not necessarily mention gloves or sanitation.
 // Require an explicit warning, a concrete hazard and a protective action.
 const refrigerantSafety=/\bsafety warning\b/i.test(String(text))&&
  /\b(?:refrigerant|cylinder|pressure|electrical|ignition)\b/i.test(String(text))&&
  /\b(?:rupture|frostbite|exposure|overpressure|shock|fire|explosion)\b/i.test(String(text))&&
  /\b(?:never|do not|stop (?:if|for|when)|before[^.!?]{0,100}(?:identify|inspect|verify|isolate))\b/i.test(String(text));
 if(fallback==='safety_warning'||fallback==='safety_scene'||(namedSafety||narratedSafetyProcedure)&&protectiveInstruction||protectiveInstruction&&explicitHazardResponse||allergyPrecaution||refrigerantSafety)return 'safety_warning';
 return roles[stage]??fallback??'field_scenario';
}
export function instructionView(board){
 return {...board,scenes:(board?.scenes??[]).map(s=>({...s,sceneType:sceneRole(s.stage,s.sceneType,s.id+' '+(s.title??''),s.dialogue??s.teachingPoint??s.text??''),dialogue:s.dialogue??s.teachingPoint??s.text??'',action:s.action??s.teachingPoint??s.dialogue??s.text??'',requiredVisualEvidence:s.requiredVisualEvidence??s.visualRequirement,shotSize:s.shotSize??'medium'}))};
}
export function repairDirective(failures,failedStep,target,previous,attempt){
 return {version:'verified-repair-v1',failedStep,target,attempt,requirements:failures.map(f=>({code:f.code,message:f.message})),previous, instructions:'Correct each listed failure in the responsible producer. Preserve lesson and competency IDs and authorized sources. Do not invent evidence or bypass a check. Return complete corrected content; it must pass independent review and pre-render validation.'};
}

/** Authoring may list a short quote before an earlier, overlapping phrase.
 * The compositor and encoded-frame inspector advance through this array, so
 * preserve every authored card while ordering its first spoken occurrence.
 * Unsupported quotes remain errors; ordering cannot invent narration/timing. */
export function orderSceneTeachingStates(storyboard) {
  const tokens = value => String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return {
    ...storyboard,
    scenes: (storyboard?.scenes ?? []).map(scene => {
      if (!scene.teachingVisual?.steps?.length) return scene;
      const spoken = tokens(scene.dialogue ?? scene.teachingPoint ?? scene.text);
      const aligned = scene.teachingVisual.steps.map((step, index) => {
        const quote = tokens(step.narrationQuote);
        const start = quote.length ? spoken.findIndex((_, offset) =>
          quote.every((word, position) => spoken[offset + position] === word)) : -1;
        if (start < 0) throw new Error('BLUEPRINT_TEACHING_VISUAL_NOT_SCRIPT_BOUND:' + scene.id + ':' + index);
        return {step, index, start};
      });
      aligned.sort((a, b) => a.start - b.start || a.index - b.index);
      if (aligned.every((item, index) => item.index === index)) return scene;
      return {...scene, teachingVisual: {...scene.teachingVisual, steps: aligned.map(item => item.step)}};
    }),
  };
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
    const match = (message + '\n' + code).match(/MEDIA_TEXT_UNREADABLE(?:_AFTER_REGION)?:(\d+):(\d+)/);
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

/**
 * Encoded-frame QA can identify a real teaching state whose transition is
 * still partially transparent at the only narration-bound sample available
 * before the next state. Keep the authored label, value and narration quote
 * unchanged; only shorten the failed scene's text transition so the complete
 * state is visible on both desktop and phone output.
 */
export function applyTeachingStateVisibilityRepair(storyboard, directive) {
  if (directive?.target !== 'scene_construction') return storyboard;
  const requirements = Array.isArray(directive.requirements) ? directive.requirements : [];
  const affected = new Map();
  for (const requirement of requirements) {
    const code = String(requirement?.code ?? '');
    const message = String(requirement?.message ?? '');
    if (!/^MEDIA_TEACHING_STATE_NOT_VISIBLE/.test(code) &&
        !/^MEDIA_TEACHING_STATE_NOT_VISIBLE/.test(message)) continue;
    const match = (message + '\n' + code).match(/MEDIA_TEACHING_STATE_NOT_VISIBLE:(.+):(\d+):(390|1280)(?:\b|$)/);
    if (!match) throw new Error('MEDIA_TEACHING_STATE_REPAIR_SCENE_REQUIRED');
    const [, sceneId, rawStep, rawWidth] = match;
    const stepIndex = Number(rawStep), width = Number(rawWidth);
    const scene = storyboard?.scenes?.find(item => item.id === sceneId);
    if (!scene) throw new Error('MEDIA_TEACHING_STATE_REPAIR_SCENE_OUT_OF_RANGE');
    if (!Number.isSafeInteger(stepIndex) || stepIndex < 0 ||
        !Array.isArray(scene.teachingVisual?.steps) || stepIndex >= scene.teachingVisual.steps.length)
      throw new Error('MEDIA_TEACHING_STATE_REPAIR_STEP_OUT_OF_RANGE');
    affected.set(sceneId, {stepIndex, width});
  }
  if (!affected.size) return storyboard;
  return {
    ...storyboard,
    scenes: storyboard.scenes.map(scene => {
      const repair = affected.get(scene.id);
      if (!repair) return scene;
      return {
        ...scene,
        teachingVisual: {
          ...scene.teachingVisual,
          transitionSeconds: 0.08,
          visibilityRepair: repair,
        },
      };
    }),
  };
}

